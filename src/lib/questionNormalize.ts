import type { Question, OptionKey, OfficialQuestionImport } from '../types';

export function normalizeImportQuestion(raw: any, defaultVersion = 1): Question {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Item de questão inválido (deve ser um objeto JSON)');
  }

  const id = String(raw.id || '').trim();
  const volume = String(raw.disciplina || raw.volume || 'Conhecimentos Gerais').trim();

  // Caderno: caderno ?? notebook ?? booklet ?? "Sem caderno"
  let rawCaderno = raw.caderno ?? raw.notebook ?? raw.booklet;
  let caderno = 'Sem caderno';
  if (rawCaderno !== undefined && rawCaderno !== null) {
    const strCad = String(rawCaderno).trim();
    if (strCad) caderno = strCad;
  }

  const topic = String(raw.topico || raw.topic || 'Geral').trim();
  const subtopic = raw.subtopico || raw.subtopic ? String(raw.subtopico || raw.subtopic).trim() : undefined;
  const statement = String(raw.enunciado || raw.statement || '').trim();

  // Parse alternativas / options
  const rawOpts = raw.alternativas || raw.options || {};
  const options: { A: string; B: string; C: string; D: string; E: string } = {
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
  };

  if (Array.isArray(rawOpts)) {
    const letters: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];
    rawOpts.forEach((optStr, idx) => {
      if (idx < 5) {
        options[letters[idx]] = String(optStr || '').trim();
      }
    });
  } else if (typeof rawOpts === 'object' && rawOpts !== null) {
    options.A = String(rawOpts.A || rawOpts.a || '').trim();
    options.B = String(rawOpts.B || rawOpts.b || '').trim();
    options.C = String(rawOpts.C || rawOpts.c || '').trim();
    options.D = String(rawOpts.D || rawOpts.d || '').trim();
    options.E = String(rawOpts.E || rawOpts.e || '').trim();
  }

  // Answer / Gabarito
  const rawAns = String(raw.gabarito || raw.answer || '').trim().toUpperCase();
  const validLetters: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];
  const answer = (validLetters.includes(rawAns as OptionKey) ? rawAns : 'A') as OptionKey;

  // Explanation / Comentário
  const explanation = String(raw.comentario || raw.explanation || '').trim();

  // Legal basis / Fundamento
  const legalBasis = raw.fundamento || raw.legalBasis ? String(raw.fundamento || raw.legalBasis).trim() : undefined;

  // Metadata & calibragem
  const rawDiff = String(raw.dificuldade || raw.difficulty || 'media').toLowerCase();
  const difficulty = (
    rawDiff === 'facil' || rawDiff === 'fácil'
      ? 'facil'
      : rawDiff === 'dificil' || rawDiff === 'difícil'
      ? 'dificil'
      : 'media'
  ) as 'facil' | 'media' | 'dificil';

  const type = raw.tipo || raw.type || 'lei_seca';
  const status = raw.status || 'revisada';
  const version = Number(raw.versao || raw.version) || defaultVersion;
  const tags = Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : [volume, topic].filter(Boolean);

  return {
    id,
    version,
    volume,
    caderno,
    topic,
    subtopic,
    difficulty,
    type,
    status,
    statement,
    options,
    answer,
    explanation,
    legalBasis,
    tags,
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
  };
}

export function validateOfficialQuestion(raw: any): { valid: boolean; errors: string[]; normalized?: Question } {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Item não é um objeto JSON válido'] };
  }

  const id = String(raw.id || '').trim();
  if (!id) {
    errors.push('Campo obrigatório "id" ausente.');
  }

  const disciplina = String(raw.disciplina || raw.volume || '').trim();
  if (!disciplina) {
    errors.push('Campo obrigatório "disciplina" ausente.');
  }

  const topico = String(raw.topico || raw.topic || '').trim();
  if (!topico) {
    errors.push('Campo obrigatório "topico" ausente.');
  }

  const enunciado = String(raw.enunciado || raw.statement || '').trim();
  if (!enunciado) {
    errors.push('Campo obrigatório "enunciado" ausente.');
  }

  const rawOpts = raw.alternativas || raw.options;
  if (!rawOpts || typeof rawOpts !== 'object') {
    errors.push('Campo obrigatório "alternativas" ausente ou em formato inválido.');
  } else {
    const optA = String(rawOpts.A || rawOpts.a || '').trim();
    const optB = String(rawOpts.B || rawOpts.b || '').trim();
    const optC = String(rawOpts.C || rawOpts.c || '').trim();
    const optD = String(rawOpts.D || rawOpts.d || '').trim();
    const optE = String(rawOpts.E || rawOpts.e || '').trim();

    if (!optA || !optB || !optC || !optD) {
      errors.push('Alternativas incompletas. É necessário fornecer pelo menos as opções A, B, C e D.');
    }
  }

  const rawAns = String(raw.gabarito || raw.answer || '').trim().toUpperCase();
  if (!rawAns || !['A', 'B', 'C', 'D', 'E'].includes(rawAns)) {
    errors.push('Campo "gabarito" inválido ou ausente. Deve ser uma das letras: A, B, C, D ou E.');
  } else if (rawOpts && typeof rawOpts === 'object') {
    const targetOpt = String(rawOpts[rawAns] || rawOpts[rawAns.toLowerCase()] || '').trim();
    if (!targetOpt) {
      errors.push(`O gabarito indicado ("${rawAns}") corresponde a uma alternativa vazia no objeto "alternativas".`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const normalized = normalizeImportQuestion(raw);
  return { valid: true, errors: [], normalized };
}
