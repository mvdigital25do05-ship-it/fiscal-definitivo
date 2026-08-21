import React, { useState, useEffect } from 'react';
import {
  Star,
  History,
  Flag,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Scale,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ScrollText,
  Trash2,
} from 'lucide-react';
import type { SanitizedQuestion, OptionKey, SessionAnswerState } from '../types';
import { QuestionHistoryModal } from './QuestionHistoryModal';

interface Props {
  question: SanitizedQuestion;
  questionNumber: number;
  totalQuestions: number;
  answerState?: SessionAnswerState;
  isBookmarked: boolean;
  needsReview: boolean;
  mode: 'study' | 'simulado';
  isFinished?: boolean;
  onSelectOption: (option: OptionKey) => void;
  onSubmitAnswer: (option: OptionKey) => void;
  onToggleBookmark: () => void;
  onToggleReview: () => void;
  onOpenReport: () => void;
  onDeleteQuestion?: (question: SanitizedQuestion) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  isSubmitting?: boolean;
  userId?: string;
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];

export const QuestionCard: React.FC<Props> = ({
  question,
  questionNumber,
  totalQuestions,
  answerState,
  isBookmarked,
  needsReview,
  mode,
  isFinished = false,
  onSelectOption,
  onSubmitAnswer,
  onToggleBookmark,
  onToggleReview,
  onOpenReport,
  onDeleteQuestion,
  onNext,
  onPrev,
  hasPrev = false,
  hasNext = false,
  userId,
  isSubmitting = false,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [eliminatedOpts, setEliminatedOpts] = useState<Record<string, boolean>>({});
  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<OptionKey | null>(
    (answerState?.selectedAnswer as OptionKey) || question.userAnswer || null
  );

  useEffect(() => {
    setEliminatedOpts({});
  }, [question.id]);

  // Sync selected option when question changes
  useEffect(() => {
    setSelectedOpt((answerState?.selectedAnswer as OptionKey) || question.userAnswer || null);
  }, [question.id, answerState?.selectedAnswer, question.userAnswer]);

  const isAnsweredInStudy = mode === 'study' && !!answerState?.selectedAnswer;
  const showFullResolution = isAnsweredInStudy || isFinished;
  const correctAnswer = answerState?.correctAnswer || question.answer;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        if (!showFullResolution || mode === 'simulado') {
          setSelectedOpt(key as OptionKey);
          onSelectOption(key as OptionKey);
        }
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const mapNum: Record<string, OptionKey> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
        const mapped = mapNum[e.key];
        if (!showFullResolution || mode === 'simulado') {
          setSelectedOpt(mapped);
          onSelectOption(mapped);
        }
      } else if (e.key === 'Enter') {
        if (selectedOpt && (!showFullResolution || mode === 'simulado') && !isSubmitting) {
          onSubmitAnswer(selectedOpt);
        }
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOpt, showFullResolution, mode, isSubmitting, hasNext, hasPrev, onNext, onPrev, onSelectOption, onSubmitAnswer]);

  const handleOptionClick = (key: OptionKey) => {
    if (showFullResolution && mode === 'study') return;
    
    // If the option is already eliminated, a single click restores it immediately
    if (eliminatedOpts[key]) {
      if (clickStateRef.current.timeout) {
        clearTimeout(clickStateRef.current.timeout);
        clickStateRef.current.timeout = null;
        clickStateRef.current.key = null;
      }
      setEliminatedOpts(prev => ({ ...prev, [key]: false }));
      return;
    }

    if (clickStateRef.current.timeout && clickStateRef.current.key === key) {
      // Double click detected on the SAME option -> Eliminate it
      clearTimeout(clickStateRef.current.timeout);
      clickStateRef.current.timeout = null;
      clickStateRef.current.key = null;
      setEliminatedOpts(prev => ({ ...prev, [key]: true }));
    } else {
      // If there's a pending click on ANOTHER option, trigger it immediately
      if (clickStateRef.current.timeout && clickStateRef.current.key && clickStateRef.current.key !== key) {
        clearTimeout(clickStateRef.current.timeout);
        setSelectedOpt(clickStateRef.current.key as OptionKey);
        onSelectOption(clickStateRef.current.key as OptionKey);
      }
      
      // Single click detected -> Wait to see if it's a double click
      clickStateRef.current.key = key;
      clickStateRef.current.timeout = setTimeout(() => {
        clickStateRef.current.timeout = null;
        clickStateRef.current.key = null;
        setSelectedOpt(key);
        onSelectOption(key);
      }, 250);
    }
  };

  const handleConfirm = () => {
    if (selectedOpt && !isSubmitting) {
      onSubmitAnswer(selectedOpt);
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'facil':
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] rounded-md font-mono">Fácil</span>;
      case 'dificil':
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] rounded-md font-mono">Difícil</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] rounded-md font-mono">Média</span>;
    }
  };

  const getTypeLabel = (t: string) => {
    const labels: Record<string, string> = {
      lei_seca: 'Lei Seca',
      conceitual: 'Doutrina / Conceitual',
      caso_pratico: 'Caso Prático',
      integracao: 'Integração de Conteúdo',
      prazo_numero: 'Prazos e Números',
      assertivas: 'Assertivas I-II-III',
    };
    return labels[t] || t;
  };

  return (
    <div id={`question-card-${question.id}`} className="bg-white rounded-xl border border-[#EAE6DF] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-[#EAE6DF] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-[#1C1917] bg-[#EAE5D9] px-2.5 py-1 rounded-md border border-[#D6CEBE]">
            Questão {questionNumber} de {totalQuestions}
          </span>
          <span className="text-xs font-semibold text-[#1A1A1A]">{question.volume}</span>
          {question.caderno && (
            <>
              <span className="text-[#A8A29E]">•</span>
              <span className="text-xs font-medium text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded border border-[#FDE68A]">{question.caderno}</span>
            </>
          )}
          <span className="text-[#A8A29E]">•</span>
          <span className="text-xs text-[#57534E] font-medium">{question.topic}</span>
          {question.subtopic && (
            <>
              <span className="text-[#A8A29E]">•</span>
              <span className="text-xs text-[#78716C]">{question.subtopic}</span>
            </>
          )}
        </div>

        {/* Action icons & Top Confirm Button */}
        <div className="flex items-center gap-1.5">
          {mode === 'study' && !showFullResolution && (
            <button
              type="button"
              id={`submit-answer-btn-top-${question.id}`}
              onClick={handleConfirm}
              disabled={!selectedOpt || isSubmitting}
              className="px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#292524] disabled:opacity-40 text-[#FAF8F5] rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer mr-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{isSubmitting ? 'Validando...' : 'Confirmar Resposta'}</span>
            </button>
          )}

          <button
            id={`bookmark-btn-${question.id}`}
            onClick={onToggleBookmark}
            title={isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              isBookmarked
                ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                : 'bg-white text-[#78716C] hover:text-[#B45309] hover:bg-[#FAF8F5] border-[#EAE6DF]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-[#D97706] text-[#D97706]' : ''}`} />
            <span className="hidden sm:inline text-[11px] font-medium">{isBookmarked ? 'Favorita' : 'Favoritar'}</span>
          </button>

          <button
            id={`review-btn-${question.id}`}
            onClick={onToggleReview}
            title={needsReview ? 'Remover marcação de revisão' : 'Marcar para revisar depois'}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              needsReview
                ? 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]'
                : 'bg-white text-[#78716C] hover:text-[#4338CA] hover:bg-[#FAF8F5] border-[#EAE6DF]'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${needsReview ? 'fill-[#4338CA] text-[#4338CA]' : ''}`} />
            <span className="hidden sm:inline text-[11px] font-medium">{needsReview ? 'Revisando' : 'Revisar'}</span>
          </button>

          <button
            id={`report-btn-${question.id}`}
            onClick={onOpenReport}
            title="Reportar problema nesta questão"
            className="p-1.5 rounded-lg border bg-white border-[#EAE6DF] text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <AlertCircle className="w-3.5 h-3.5" />
          </button>

          {userId && (
            <>
              <button
                id={`history-btn-${question.id}`}
                onClick={() => setIsHistoryOpen(true)}
                title="Ver histórico desta questão"
                className="p-1.5 rounded-lg border bg-white border-[#EAE6DF] text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
              </button>
              <QuestionHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                questionId={question.id}
                userId={userId}
              />
            </>
          )}

          {onDeleteQuestion && (
            <button
              id={`delete-question-btn-${question.id}`}
              onClick={() => onDeleteQuestion(question)}
              title="Excluir esta questão"
              className="p-1.5 rounded-lg border bg-white border-[#EAE6DF] text-[#A8A29E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        {/* Badges & Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {getDifficultyBadge(question.difficulty)}
          <span className="px-2 py-0.5 text-[11px] font-medium bg-[#FAF8F5] text-[#57534E] rounded-md border border-[#EAE6DF]">
            {getTypeLabel(question.type)}
          </span>
          <span className="text-[11px] font-mono text-[#78716C] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EAE6DF]">
            ID: {question.id} (v{question.version})
          </span>
        </div>

        {/* Statement / Enunciado (Editorial Serif Typography) */}
        <div className="font-editorial-serif text-[17px] sm:text-[18px] leading-[1.7] text-[#1A1A1A] font-normal whitespace-pre-line tracking-normal select-text">
          {question.statement}
        </div>

        {/* Options Header & Top Confirm Button */}
        <div className="flex items-center justify-between gap-2 pt-2 pb-1 border-b border-[#F2EDE4]">
          <span className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
            Opções de Resposta
          </span>

          {mode === 'study' && !showFullResolution && (
            <button
              type="button"
              id={`submit-answer-btn-above-options-${question.id}`}
              onClick={handleConfirm}
              disabled={!selectedOpt || isSubmitting}
              className="px-4 py-1.5 bg-[#1C1917] hover:bg-[#292524] disabled:opacity-40 text-[#FAF8F5] rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{isSubmitting ? 'Validando...' : 'Confirmar Resposta'}</span>
            </button>
          )}
        </div>

        {/* Options A - E */}
        <div className="space-y-2.5 pt-1">
          {OPTION_KEYS.map((key) => {
            const text = question.options[key];
            if (!text) return null;

            const isSelected = selectedOpt === key;
            const isEliminated = !!eliminatedOpts[key];
            const isThisCorrect = correctAnswer === key;
            const isThisWrongSelected = isSelected && showFullResolution && !isThisCorrect;

            let optionStyle = 'bg-[#FAF8F5] border-[#EAE6DF] hover:bg-[#F2ECE0] hover:border-[#D6CEBE] text-[#1A1A1A]';
            let badgeStyle = 'bg-[#EAE5D9] text-[#1C1917] border-[#D6CEBE] font-bold';

            if (showFullResolution) {
              if (isThisCorrect) {
                // Correct option in Forest Green
                optionStyle = 'bg-[#F0FDF4] border-[#86EFAC] text-[#14532D] font-medium ring-1 ring-[#22C55E]';
                badgeStyle = 'bg-[#15803D] text-white border-[#15803D] font-bold';
              } else if (isThisWrongSelected) {
                // Chosen wrong option in Brick Red
                optionStyle = 'bg-[#FEF2F2] border-[#FCA5A5] text-[#7F1D1D] font-medium ring-1 ring-[#EF4444]';
                badgeStyle = 'bg-[#B91C1C] text-white border-[#B91C1C] font-bold';
              } else {
                optionStyle = 'bg-[#FAF8F5]/60 border-[#EAE6DF] text-[#78716C] opacity-75';
                badgeStyle = 'bg-[#EAE5D9]/60 text-[#78716C] border-[#EAE6DF] font-medium';
              }
            } else {
              // During active exam/study before answer
              if (isSelected) {
                optionStyle = 'bg-[#F2ECE0] border-[#1C1917] text-[#1C1917] font-medium ring-1 ring-[#1C1917] shadow-2xs';
                badgeStyle = 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917] font-bold';
              }
            }

            return (
              <button
                key={key}
                type="button"
                id={`option-btn-${question.id}-${key}`}
                onClick={() => handleOptionClick(key)}
                disabled={showFullResolution && mode === 'study'}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 group cursor-pointer disabled:cursor-default ${optionStyle} ${isEliminated ? 'opacity-50' : ''}`}
              >
                <span
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs shrink-0 transition-colors font-mono ${badgeStyle}`}
                >
                  {key}
                </span>
                <span className={`text-sm sm:text-[14.5px] leading-relaxed pt-0.5 flex-1 select-text font-normal ${isEliminated ? 'line-through text-[#A8A29E]' : ''}`}>{text}</span>
                {showFullResolution && isThisCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />
                )}
                {showFullResolution && isThisWrongSelected && (
                  <XCircle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Bar (Confirm / Navigation) */}
        <div className="pt-4 border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#78716C] hidden sm:block font-mono">
            Atalhos: <kbd className="px-1.5 py-0.5 bg-[#FAF8F5] border border-[#D6CEBE] rounded text-[11px] text-[#1C1917]">A-E</kbd> selecionar,{' '}
            <kbd className="px-1.5 py-0.5 bg-[#FAF8F5] border border-[#D6CEBE] rounded text-[11px] text-[#1C1917]">Enter</kbd> responder
          </div>

          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id={`prev-question-btn-${question.id}`}
                onClick={onPrev}
                disabled={!hasPrev}
                className="px-3 py-2 border border-[#EAE6DF] hover:bg-[#F2ECE0] disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-medium text-[#57534E] hover:text-[#1C1917] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                id={`next-question-btn-${question.id}`}
                onClick={onNext}
                disabled={!hasNext}
                className="px-3 py-2 border border-[#EAE6DF] hover:bg-[#F2ECE0] disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-medium text-[#57534E] hover:text-[#1C1917] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* In Study mode: button to respond */}
            {mode === 'study' && !showFullResolution && (
              <button
                type="button"
                id={`submit-answer-btn-${question.id}`}
                onClick={handleConfirm}
                disabled={!selectedOpt || isSubmitting}
                className="px-5 py-2 bg-[#1C1917] hover:bg-[#292524] disabled:opacity-40 text-[#FAF8F5] rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{isSubmitting ? 'Validando...' : 'Confirmar Resposta'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Server-Validated Feedback & Explanation (Unlocked only post-answer) */}
        {showFullResolution && (
          <div
            id={`resolution-panel-${question.id}`}
            className="mt-6 pt-6 border-t border-[#EAE6DF] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Success / Error Header */}
            {answerState?.isCorrect !== undefined && (
              <div
                className={`p-4 rounded-xl border flex items-center gap-3 ${
                  answerState.isCorrect
                    ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]'
                    : 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
                }`}
              >
                {answerState.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#B91C1C] shrink-0" />
                )}
                <div>
                  <div className="font-editorial-heading text-sm font-bold flex items-center gap-2">
                    <span>{answerState.isCorrect ? 'Resposta Correta' : 'Resposta Incorreta'}</span>
                    {!answerState.isCorrect && (
                      <span className="text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded-md flex items-center gap-1">
                        📕 Registrada no Caderno de Erros
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">
                    Gabarito Oficial: <strong className="font-mono text-sm">{correctAnswer}</strong>
                    {selectedOpt && selectedOpt !== correctAnswer && (
                      <span> (Você assinalou opção {selectedOpt})</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Legal Basis / Fundamento */}
            {(answerState?.legalBasis || question.legalBasis) && (
              <div className="p-3.5 bg-[#FAF8F5] border-l-4 border-[#B45309] border-y border-r border-[#EAE6DF] rounded-r-xl flex items-start gap-2.5">
                <Scale className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                <div className="text-xs text-[#44403C]">
                  <span className="font-bold text-[#1C1917]">Fundamentação Legal: </span>
                  <span className="font-mono text-[#57534E] font-medium">{answerState?.legalBasis || question.legalBasis}</span>
                </div>
              </div>
            )}

            {/* Detailed Explanation */}
            {(answerState?.explanation || question.explanation) && (
              <div className="p-5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917] uppercase tracking-wide font-editorial-heading">
                  <BookOpen className="w-4 h-4 text-[#B45309]" />
                  <span>Comentário & Análise Didática</span>
                </div>
                <div className="font-editorial-serif text-[15.5px] leading-[1.7] text-[#292524] whitespace-pre-line font-normal">
                  {answerState?.explanation || question.explanation}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

