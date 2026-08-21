import React, { useState, useEffect } from 'react';
import {
  Timer,
  AlertTriangle,
  Flag,
  Star,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import type { StudySession, OptionKey, SessionAnswerState } from '../types';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionMap } from '../components/QuestionMap';
import { SimuladoTimer } from '../components/SimuladoTimer';
import { ReportIssueModal } from '../components/ReportIssueModal';
import { SessionFinishModal } from '../components/SessionFinishModal';
import { api } from '../services/api';

interface Props {
  session: StudySession;
  userId: string;
  userEmail?: string;
  onUpdateSession: (updated: StudySession) => void;
  onFinishSimulado: (sessionId: string, timeSpentSeconds: number) => void;
}

export const SimuladoView: React.FC<Props> = ({
  session,
  userId,
  userEmail,
  onUpdateSession,
  onFinishSimulado,
}) => {
  const [currentIndex, setCurrentIndex] = useState(session.currentIndex || 0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [timeSpent, setTimeSpent] = useState(session.timeSpentSeconds || 0);

  const currentQuestion = session.questions[currentIndex];
  const answers = session.answers || {};
  const total = session.questions.length;
  const answeredCount = Object.keys(answers).filter((qId) => !!answers[qId]?.selectedAnswer).length;
  const blankCount = total - answeredCount;

  const handleSelectOption = async (opt: OptionKey) => {
    if (!currentQuestion) return;

    const updatedAnswers: Record<string, SessionAnswerState> = {
      ...answers,
      [currentQuestion.id]: {
        selectedAnswer: opt,
        timestamp: Date.now(),
      },
    };

    const updatedQuestions = [...session.questions];
    updatedQuestions[currentIndex] = {
      ...currentQuestion,
      userAnswer: opt,
    };

    const updatedSession: StudySession = {
      ...session,
      answers: updatedAnswers,
      questions: updatedQuestions,
      currentIndex,
    };

    onUpdateSession(updatedSession);

    // Save answer state on server asynchronously
    try {
      await api.submitAnswer({
        sessionId: session.id,
        questionId: currentQuestion.id,
        questionVersion: currentQuestion.version,
        selectedAnswer: opt,
        responseTimeSeconds: 0,
        mode: 'simulado',
        userId,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentQuestion) return;
    const isCurrently = !!session.bookmarked[currentQuestion.id];
    const newBookmarked = {
      ...session.bookmarked,
      [currentQuestion.id]: !isCurrently,
    };
    onUpdateSession({ ...session, bookmarked: newBookmarked });

    try {
      await api.toggleFavorite({
        userId,
        questionId: currentQuestion.id,
        bookmarked: !isCurrently,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReview = async () => {
    if (!currentQuestion) return;
    const isCurrently = !!session.needsReview[currentQuestion.id];
    const newNeedsReview = {
      ...session.needsReview,
      [currentQuestion.id]: !isCurrently,
    };
    onUpdateSession({ ...session, needsReview: newNeedsReview });

    try {
      await api.toggleFavorite({
        userId,
        questionId: currentQuestion.id,
        needsReview: !isCurrently,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleConfirmFinish = () => {
    setFinishModalOpen(false);
    onFinishSimulado(session.id, timeSpent);
  };

  return (
    <div id="simulado-view-layout" className="max-w-7xl mx-auto space-y-6">
      {/* Simulado Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-[#1C1917] flex items-center justify-center font-bold">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">{session.title}</h2>
            <div className="text-xs text-[#78716C] font-mono mt-0.5">
              Questão <strong className="text-[#1C1917]">{currentIndex + 1}</strong> de <strong className="text-[#1C1917]">{total}</strong> • {answeredCount} assinaladas
            </div>
          </div>
        </div>

        {/* Timer & Finish Trigger */}
        <div className="flex items-center gap-3">
          <SimuladoTimer
            initialSeconds={session.timeLimitSeconds || 0}
            isCountdown={!!session.timeLimitSeconds}
            onTick={(s) => setTimeSpent((prev) => prev + 1)}
            onTimeExpired={() => handleConfirmFinish()}
          />

          <button
            id="finish-simulado-btn"
            onClick={() => setFinishModalOpen(true)}
            className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Finalizar Prova</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EAE6DF] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#1C1917] h-full transition-all duration-300 rounded-full"
          style={{ width: `${Math.round(((currentIndex + 1) / total) * 100)}%` }}
        />
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question Card */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <QuestionCard
            userId={userId}
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={total}
            answerState={answers[currentQuestion.id]}
            isBookmarked={!!session.bookmarked[currentQuestion.id]}
            needsReview={!!session.needsReview[currentQuestion.id]}
            mode="simulado"
            onSelectOption={handleSelectOption}
            onSubmitAnswer={handleSelectOption}
            onToggleBookmark={handleToggleBookmark}
            onToggleReview={handleToggleReview}
            onOpenReport={() => setReportModalOpen(true)}
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={currentIndex < total - 1}
            hasPrev={currentIndex > 0}
          />
        </div>

        {/* Question Map Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <QuestionMap
            questions={session.questions}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
            answers={answers}
            bookmarked={session.bookmarked}
            needsReview={session.needsReview}
            mode="simulado"
          />

          <div className="p-4 bg-white border border-[#EAE6DF] rounded-xl text-xs text-[#78716C] space-y-2 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="font-mono font-bold text-[#1C1917] uppercase text-[10px] tracking-wider">
              Instruções do Simulado
            </div>
            <ul className="list-disc list-inside space-y-1 font-editorial-serif text-[#57534E] text-[12.5px] leading-relaxed">
              <li>Você pode alternar respostas a qualquer momento.</li>
              <li>O gabarito oficial será liberado após a finalização.</li>
              <li>Use as bandeiras para marcar itens para revisão rápida.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        questionId={currentQuestion.id}
        questionVersion={currentQuestion.version}
        userId={userId}
        userEmail={userEmail}
      />

      {/* Finish Simulado Modal */}
      <SessionFinishModal
        isOpen={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        onConfirm={handleConfirmFinish}
        total={total}
        answered={answeredCount}
        blank={blankCount}
        mode="simulado"
      />
    </div>
  );
};

