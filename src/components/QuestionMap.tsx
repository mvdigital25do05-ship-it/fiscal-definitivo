import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import type { SanitizedQuestion, SessionAnswerState } from '../types';

interface Props {
  questions: SanitizedQuestion[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  answers: Record<string, SessionAnswerState>;
  bookmarked: Record<string, boolean>;
  needsReview: Record<string, boolean>;
  mode: 'study' | 'simulado';
  isFinished?: boolean;
}

const PAGE_SIZE = 20;

export const QuestionMap: React.FC<Props> = ({
  questions,
  currentIndex,
  onSelectIndex,
  answers,
  bookmarked,
  needsReview,
  mode,
  isFinished = false,
}) => {
  // Calculate total pages of 20 questions each
  const totalPages = Math.ceil(questions.length / PAGE_SIZE) || 1;
  const [activePage, setActivePage] = useState<number>(0);
  const [showAll, setShowAll] = useState<boolean>(false);

  // Auto-switch block tab when currentIndex moves outside current active page
  useEffect(() => {
    if (!showAll) {
      const pageForCurrent = Math.floor(currentIndex / PAGE_SIZE);
      if (pageForCurrent !== activePage && pageForCurrent < totalPages) {
        setActivePage(pageForCurrent);
      }
    }
  }, [currentIndex, totalPages]);

  // Subset of questions to display
  const startIdx = activePage * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, questions.length);

  const displayedIndices = showAll
    ? Array.from({ length: questions.length }, (_, i) => i)
    : Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i);

  // Count answered in active block
  const blockAnsweredCount = displayedIndices.filter(
    (idx) => !!answers[questions[idx]?.id]?.selectedAnswer
  ).length;

  return (
    <div id="question-map-card" className="bg-white rounded-xl border border-[#EAE6DF] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F2EDE4] pb-2.5">
        <div>
          <h4 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#1C1917]" />
            <span>Mapa de Questões</span>
          </h4>
          <span className="text-[11px] font-mono text-[#A8A29E] block mt-0.5">
            Total: {questions.length} questões
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-[#1C1917] block">
            {Object.keys(answers).length}/{questions.length}
          </span>
          <span className="text-[10px] text-[#78716C]">respondidas</span>
        </div>
      </div>

      {/* Block selection pagination tabs (20 em 20) */}
      {questions.length > PAGE_SIZE && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#78716C] uppercase">
              Blocos de 20:
            </span>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-[10px] font-mono text-[#1C1917] hover:underline font-semibold cursor-pointer"
            >
              {showAll ? 'Ver por blocos (20)' : 'Ver Todas'}
            </button>
          </div>

          {!showAll && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {Array.from({ length: totalPages }, (_, pIdx) => {
                const pStart = pIdx * PAGE_SIZE + 1;
                const pEnd = Math.min((pIdx + 1) * PAGE_SIZE, questions.length);
                const isSelected = activePage === pIdx;

                return (
                  <button
                    key={pIdx}
                    id={`map-block-tab-${pIdx}`}
                    onClick={() => setActivePage(pIdx)}
                    className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917] shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#78716C] border-[#EAE6DF] hover:bg-[#F2ECE0] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {pStart} - {pEnd}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Block indicator subtitle */}
      {!showAll && questions.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-[11px] font-mono text-[#78716C] bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-[#EAE6DF]">
          <span>
            Questões <strong>{startIdx + 1}</strong> a <strong>{endIdx}</strong>
          </span>
          <span className="font-semibold text-[#1C1917]">
            {blockAnsweredCount}/{endIdx - startIdx} respondidas
          </span>
        </div>
      )}

      {/* Grid of numbers */}
      <div className="grid grid-cols-5 gap-2">
        {displayedIndices.map((idx) => {
          const q = questions[idx];
          if (!q) return null;
          const isCurrent = idx === currentIndex;
          const ans = answers[q.id];
          const isAnswered = !!ans?.selectedAnswer;
          const isBookmarked = !!bookmarked[q.id];
          const isReview = !!needsReview[q.id];

          // Determine button style
          let bgClass = 'bg-[#FAF8F5] text-[#57534E] hover:bg-[#F2ECE0] border-[#EAE6DF]';
          let borderRing = isCurrent
            ? 'ring-2 ring-[#1C1917] ring-offset-1 font-bold text-[#1C1917] scale-[1.03]'
            : '';

          if (mode === 'study' || isFinished) {
            if (ans && ans.isCorrect === true) {
              bgClass = 'bg-[#15803D] text-white border-[#15803D]';
            } else if (ans && ans.isCorrect === false) {
              bgClass = 'bg-[#B91C1C] text-white border-[#B91C1C]';
            }
          } else {
            // Simulado in progress: don't reveal right/wrong
            if (isAnswered) {
              bgClass = 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917]';
            }
          }

          return (
            <button
              key={q.id}
              id={`map-btn-question-${idx + 1}`}
              onClick={() => onSelectIndex(idx)}
              className={`relative h-9 rounded-lg text-xs font-mono font-semibold border flex items-center justify-center transition-all cursor-pointer ${bgClass} ${borderRing}`}
              title={`Questão ${idx + 1}: ${q.topic || 'Geral'} - ${isAnswered ? 'Respondida' : 'Pendente'}`}
            >
              <span>{idx + 1}</span>

              {/* Status mini badges */}
              <div className="absolute -top-1 -right-1 flex items-center gap-0.5 pointer-events-none">
                {isBookmarked && (
                  <span className="w-3 h-3 bg-[#F59E0B] text-white rounded-full flex items-center justify-center text-[8px] shadow-2xs font-bold">
                    ★
                  </span>
                )}
                {isReview && (
                  <span className="w-3 h-3 bg-[#4F46E5] text-white rounded-full flex items-center justify-center text-[7px] shadow-2xs font-bold">
                    ⚑
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-[#EAE6DF] grid grid-cols-2 gap-1.5 text-[11px] text-[#78716C]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FAF8F5] border border-[#D6CEBE]"></span>
          <span>Pendente</span>
        </div>
        {mode === 'study' || isFinished ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]"></span>
              <span>Acertou</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]"></span>
              <span>Errou</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1C1917]"></span>
            <span>Marcada</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 text-[#D97706] text-[10px] leading-none flex items-center justify-center font-bold">★</span>
          <span>Favorita</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 text-[#4338CA] text-[10px] leading-none flex items-center justify-center font-bold">⚑</span>
          <span>Revisar</span>
        </div>
      </div>
    </div>
  );
};
