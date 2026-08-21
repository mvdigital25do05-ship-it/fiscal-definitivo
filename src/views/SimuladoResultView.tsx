import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Filter,
  Check,
  Layers,
} from 'lucide-react';
import type { StudySession, OptionKey } from '../types';
import { QuestionCard } from '../components/QuestionCard';

interface Props {
  session: StudySession;
  onNewSimulado: () => void;
  onBackToDashboard: () => void;
}

export const SimuladoResultView: React.FC<Props> = ({
  session,
  onNewSimulado,
  onBackToDashboard,
}) => {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [reviewFilter, setReviewFilter] = useState<'todas' | 'corretas' | 'erradas' | 'brancas'>('todas');

  const stats = session.stats || {
    total: session.questions.length,
    answered: Object.keys(session.answers).length,
    correct: 0,
    wrong: 0,
    blank: 0,
    percentage: 0,
    timeSpentSeconds: session.timeSpentSeconds || 0,
    topicBreakdown: {},
    difficultyBreakdown: { facil: { total: 0, correct: 0, wrong: 0 }, media: { total: 0, correct: 0, wrong: 0 }, dificil: { total: 0, correct: 0, wrong: 0 } },
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}min ${secs}s`;
  };

  const filteredQuestions = session.questions.filter((q) => {
    const ansState = session.answers[q.id];
    if (reviewFilter === 'corretas') return ansState?.isCorrect === true;
    if (reviewFilter === 'erradas') return ansState?.isCorrect === false && !!ansState?.selectedAnswer;
    if (reviewFilter === 'brancas') return !ansState?.selectedAnswer;
    return true;
  });

  const currentQ = session.questions[selectedQuestionIndex];

  return (
    <div id="simulado-result-view" className="max-w-6xl mx-auto space-y-8">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-[#1C1917] flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-editorial-heading text-2xl font-bold text-[#1A1A1A]">Resultado do Simulado</h1>
              <p className="font-editorial-serif text-xs text-[#78716C] mt-0.5">{session.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="back-to-dashboard-result-btn"
              onClick={onBackToDashboard}
              className="px-4 py-2 border border-[#EAE6DF] bg-white hover:bg-[#FAF8F5] text-[#57534E] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Voltar ao Início
            </button>
            <button
              id="new-simulado-result-btn"
              onClick={onNewSimulado}
              className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Novo Simulado</span>
            </button>
          </div>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF]">
            <div className="text-xs text-[#78716C] font-medium font-mono">Aproveitamento</div>
            <div className="font-editorial-heading text-3xl font-extrabold text-[#1C1917] mt-1">{stats.percentage}%</div>
            <div className="text-[11px] font-mono text-[#A8A29E] mt-0.5">Nota consolidada</div>
          </div>

          <div className="p-4 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0]">
            <div className="text-xs text-[#15803D] font-medium font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Acertos</span>
            </div>
            <div className="font-editorial-heading text-3xl font-extrabold text-[#15803D] mt-1">{stats.correct}</div>
            <div className="text-[11px] font-mono text-[#16A34A] mt-0.5">de {stats.total} questões</div>
          </div>

          <div className="p-4 bg-[#FEF2F2] rounded-xl border border-[#FECACA]">
            <div className="text-xs text-[#B91C1C] font-medium font-mono flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
              <span>Erros</span>
            </div>
            <div className="font-editorial-heading text-3xl font-extrabold text-[#B91C1C] mt-1">{stats.wrong}</div>
            <div className="text-[11px] font-mono text-[#DC2626] mt-0.5">respostas incorretas</div>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF]">
            <div className="text-xs text-[#78716C] font-medium font-mono">Em Branco</div>
            <div className="font-editorial-heading text-3xl font-extrabold text-[#57534E] mt-1">{stats.blank}</div>
            <div className="text-[11px] font-mono text-[#A8A29E] mt-0.5">não assinaladas</div>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] col-span-2 sm:col-span-1">
            <div className="text-xs text-[#78716C] font-medium font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#78716C]" />
              <span>Tempo Total</span>
            </div>
            <div className="font-editorial-heading text-xl font-bold text-[#1C1917] mt-1.5">{formatTime(stats.timeSpentSeconds)}</div>
            <div className="text-[11px] font-mono text-[#A8A29E] mt-0.5">
              ~{stats.total > 0 ? Math.round(stats.timeSpentSeconds / stats.total) : 0}s por item
            </div>
          </div>
        </div>

        {/* Topic Breakdown */}
        {stats.topicBreakdown && Object.keys(stats.topicBreakdown).length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
              Desempenho por Tópico da Prova
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.entries(stats.topicBreakdown) as Array<[string, { total: number; correct: number; wrong: number; percentage: number }]>).map(([top, tData]) => (
                <div key={top} className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] text-xs space-y-1.5">
                  <div className="font-semibold text-[#1A1A1A] truncate" title={top}>
                    {top}
                  </div>
                  <div className="flex items-center justify-between text-[#57534E] font-mono">
                    <span>
                      {tData.correct}/{tData.total} acertos
                    </span>
                    <span className="font-bold text-[#1C1917]">{tData.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#EAE6DF] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${tData.percentage >= 70 ? 'bg-[#15803D]' : tData.percentage >= 50 ? 'bg-[#B45309]' : 'bg-[#B91C1C]'}`}
                      style={{ width: `${tData.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial-heading text-lg font-bold text-[#1A1A1A]">Revisão Completa do Gabarito</h2>
            <p className="font-editorial-serif text-xs text-[#78716C]">
              Analise cada questão com gabarito oficial e fundamentação jurídica liberados.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 border border-[#EAE6DF] rounded-xl text-xs font-mono font-medium">
            <button
              onClick={() => setReviewFilter('todas')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                reviewFilter === 'todas' ? 'bg-white text-[#1C1917] shadow-2xs font-bold border border-[#EAE6DF]' : 'text-[#78716C]'
              }`}
            >
              Todas ({session.questions.length})
            </button>
            <button
              onClick={() => setReviewFilter('corretas')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                reviewFilter === 'corretas' ? 'bg-[#F0FDF4] text-[#15803D] shadow-2xs font-bold border border-[#BBF7D0]' : 'text-[#78716C]'
              }`}
            >
              Acertos ({stats.correct})
            </button>
            <button
              onClick={() => setReviewFilter('erradas')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                reviewFilter === 'erradas' ? 'bg-[#FEF2F2] text-[#B91C1C] shadow-2xs font-bold border border-[#FECACA]' : 'text-[#78716C]'
              }`}
            >
              Erros ({stats.wrong})
            </button>
            <button
              onClick={() => setReviewFilter('brancas')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                reviewFilter === 'brancas' ? 'bg-white text-[#57534E] shadow-2xs font-bold border border-[#EAE6DF]' : 'text-[#78716C]'
              }`}
            >
              Em Branco ({stats.blank})
            </button>
          </div>
        </div>

        {/* Question Selector List / Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {session.questions.map((q, idx) => {
            const ans = session.answers[q.id];
            const isCorrect = ans?.isCorrect === true;
            const isWrong = ans?.isCorrect === false && !!ans?.selectedAnswer;
            const isBlank = !ans?.selectedAnswer;
            const isSelected = selectedQuestionIndex === idx;

            return (
              <button
                key={q.id}
                id={`review-nav-btn-${idx + 1}`}
                onClick={() => setSelectedQuestionIndex(idx)}
                className={`w-9 h-9 rounded-lg text-xs font-mono font-bold shrink-0 border flex items-center justify-center transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-[#1C1917] ring-offset-1 scale-105' : ''
                } ${
                  isCorrect
                    ? 'bg-[#15803D] text-white border-[#15803D]'
                    : isWrong
                    ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                    : 'bg-[#FAF8F5] text-[#57534E] border-[#EAE6DF]'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Active Reviewed Question Card */}
        {currentQ && (
          <div className="max-w-4xl mx-auto">
            <QuestionCard
              userId={session.userId}
              question={currentQ}
              questionNumber={selectedQuestionIndex + 1}
              totalQuestions={session.questions.length}
              answerState={session.answers[currentQ.id]}
              isBookmarked={!!session.bookmarked[currentQ.id]}
              needsReview={!!session.needsReview[currentQ.id]}
              mode="simulado"
              isFinished={true}
              onSelectOption={() => {}}
              onSubmitAnswer={() => {}}
              onToggleBookmark={() => {}}
              onToggleReview={() => {}}
              onOpenReport={() => {}}
              onNext={() => selectedQuestionIndex < session.questions.length - 1 && setSelectedQuestionIndex((p) => p + 1)}
              onPrev={() => selectedQuestionIndex > 0 && setSelectedQuestionIndex((p) => p - 1)}
              hasNext={selectedQuestionIndex < session.questions.length - 1}
              hasPrev={selectedQuestionIndex > 0}
            />
          </div>
        )}
      </div>
    </div>
  );
};

