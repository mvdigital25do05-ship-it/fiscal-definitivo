import { Question, QualityAuditWarning } from '../types';

const CATEGORICAL_WORDS = [
  'sempre',
  'nunca',
  'somente',
  'exclusivamente',
  'automaticamente',
  'em nenhuma hipótese',
  'em qualquer hipótese',
  'em qualquer caso',
  'imprescindivelmente',
  'jamais',
  'absolutamente',
];

export function auditSingleQuestion(
  q: Partial<Question>,
  allQuestions: Partial<Question>[] = []
): QualityAuditWarning[] {
  const warnings: QualityAuditWarning[] = [];
  const qId = q.id || 'sem-id';

  // 1. Check missing options
  const options = q.options || ({} as any);
  const keys: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C', 'D', 'E'];
  const missingKeys = keys.filter((k) => !options[k] || !options[k].trim());
  if (missingKeys.length > 0) {
    warnings.push({
      code: 'OPTION_MISSING_OR_EMPTY',
      severity: 'warning',
      message: `Alternativas ausentes ou vazias: ${missingKeys.join(', ')}`,
      questionId: qId,
    });
    return warnings; // cannot run deep option checks if options are missing
  }

  // 2. Check explanation and legal basis
  if (!q.explanation || q.explanation.trim().length < 15) {
    warnings.push({
      code: 'MISSING_EXPLANATION_OR_LEGAL_BASIS',
      severity: 'warning',
      message: 'Comentário explicativo ausente ou demasiadamente curto.',
      questionId: qId,
    });
  }
  if (!q.legalBasis || q.legalBasis.trim().length < 4) {
    warnings.push({
      code: 'MISSING_EXPLANATION_OR_LEGAL_BASIS',
      severity: 'info',
      message: 'Fundamento legal ou norma de referência não informada.',
      questionId: qId,
    });
  }

  // 3. Option lengths & correct option disproportion
  const answerKey = q.answer as 'A' | 'B' | 'C' | 'D' | 'E';
  if (answerKey && options[answerKey]) {
    const correctLen = options[answerKey].trim().length;
    const wrongKeys = keys.filter((k) => k !== answerKey);
    const wrongLengths = wrongKeys.map((k) => options[k]?.trim().length || 0);
    const avgWrongLen = wrongLengths.reduce((a, b) => a + b, 0) / (wrongLengths.length || 1);
    const maxWrongLen = Math.max(...wrongLengths);
    const minWrongLen = Math.min(...wrongLengths);

    // If correct is > 2.0x average of wrong and correct is > 80 chars
    if (correctLen > 70 && correctLen > avgWrongLen * 1.8 && correctLen > maxWrongLen * 1.4) {
      warnings.push({
        code: 'CORRECT_OPTION_TOO_LONG',
        severity: 'warning',
        message: `Alternativa correta (${answerKey}) é significativamente mais longa (${correctLen} caracteres) que a média dos distratores (${Math.round(avgWrongLen)} carac.).`,
        questionId: qId,
        details: 'Gabarito denunciado pelo tamanho pode induzir acerto sem conhecimento real.',
      });
    }

    // 4. Distractors too short
    if (minWrongLen < 15 && avgWrongLen > 40) {
      const shortestKey = wrongKeys.find((k) => (options[k]?.trim().length || 0) === minWrongLen);
      warnings.push({
        code: 'DISTRACTORS_TOO_SHORT',
        severity: 'info',
        message: `Distrator (${shortestKey}) excessivamente curto (${minWrongLen} caracteres).`,
        questionId: qId,
      });
    }

    // 5. Categorical words in wrong options
    const foundCategoricalInWrong: string[] = [];
    wrongKeys.forEach((k) => {
      const text = (options[k] || '').toLowerCase();
      CATEGORICAL_WORDS.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(text)) {
          foundCategoricalInWrong.push(`[${k}] "${word}"`);
        }
      });
    });

    const correctText = (options[answerKey] || '').toLowerCase();
    const categoricalInCorrect = CATEGORICAL_WORDS.some((word) =>
      new RegExp(`\\b${word}\\b`, 'i').test(correctText)
    );

    if (foundCategoricalInWrong.length >= 2 && !categoricalInCorrect) {
      warnings.push({
        code: 'CATEGORICAL_WORDS_IN_WRONG',
        severity: 'warning',
        message: `Palavras categóricas/absolutas concentradas nas erradas: ${foundCategoricalInWrong.join(', ')}.`,
        questionId: qId,
        details: 'Termos como "sempre", "nunca", "exclusivamente" facilitam eliminação mecânica.',
      });
    }
  }

  // 6. Check duplicate statement with others
  if (q.statement && allQuestions.length > 1) {
    const cleanStmt = q.statement.trim().toLowerCase().replace(/[^\w\s]/gi, '').slice(0, 80);
    const duplicate = allQuestions.find((other) => {
      if (other.id === q.id) return false;
      const otherClean = (other.statement || '').trim().toLowerCase().replace(/[^\w\s]/gi, '').slice(0, 80);
      return cleanStmt.length > 30 && otherClean.length > 30 && cleanStmt === otherClean;
    });

    if (duplicate) {
      warnings.push({
        code: 'POSSIBLE_DUPLICATE_STATEMENT',
        severity: 'warning',
        message: `Enunciado muito similar ao da questão existente/duplicada [ID: ${duplicate.id}].`,
        questionId: qId,
      });
    }
  }

  return warnings;
}

export function auditBatchQuality(questions: Question[]): QualityAuditWarning[] {
  const warnings: QualityAuditWarning[] = [];
  if (!questions || questions.length === 0) return warnings;

  // 1. Answer distribution across batch
  if (questions.length >= 5) {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    questions.forEach((q) => {
      if (q.answer && counts[q.answer] !== undefined) {
        counts[q.answer]++;
      }
    });

    const total = questions.length;
    (['A', 'B', 'C', 'D', 'E'] as const).forEach((letter) => {
      const pct = (counts[letter] / total) * 100;
      if (pct > 45) {
        warnings.push({
          code: 'UNBALANCED_ANSWER_DISTRIBUTION',
          severity: 'warning',
          message: `Desbalanceamento de gabarito: alternativa "${letter}" representa ${Math.round(pct)}% do lote (${counts[letter]}/${total}).`,
        });
      }
    });

    // 2. Consecutive repeated streak
    let currentStreak = 1;
    let streakLetter = questions[0].answer;
    let maxStreak = 1;
    let maxStreakLetter = streakLetter;

    for (let i = 1; i < questions.length; i++) {
      if (questions[i].answer === streakLetter && streakLetter) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          maxStreakLetter = streakLetter;
        }
      } else {
        streakLetter = questions[i].answer;
        currentStreak = 1;
      }
    }

    if (maxStreak >= 4) {
      warnings.push({
        code: 'REPEATED_ANSWER_STREAK',
        severity: 'info',
        message: `Sequência de ${maxStreak} questões consecutivas com o mesmo gabarito ("${maxStreakLetter}").`,
      });
    }

    // 3. Question type concentration
    const typeCounts: Record<string, number> = {};
    questions.forEach((q) => {
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    });
    Object.entries(typeCounts).forEach(([type, count]) => {
      const pct = (count / total) * 100;
      if (pct > 65 && total >= 8) {
        warnings.push({
          code: 'HIGH_TYPE_CONCENTRATION',
          severity: 'info',
          message: `Concentração elevada do tipo "${type}": ${Math.round(pct)}% das questões do lote.`,
        });
      }
    });
  }

  return warnings;
}
