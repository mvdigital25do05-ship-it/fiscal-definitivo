const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { Eye, Clock, UploadCloud, BookOpen, Layers } from 'lucide-react';
import type { StudySession, OptionKey, SessionAnswerState } from '../types';
import { QuestionCard } from '../components/QuestionCard';
import { api } from '../services/api';

interface Props {
  session: StudySession | null;
  userId: string;
  userEmail?: string;
  onUpdateSession: (updated: StudySession) => void;
  onNavigateToImport: () => void;
  onNavigateToDisciplines?: () => void;
  onReloadSession: (filters?: any) => Promise<void>;
  isLoading?: boolean;
}

export const StudyView: React.FC<Props> = ({
  session,
  userId,
  userEmail,
  onUpdateSession,
  onNavigateToImport,
  onNavigateToDisciplines,
  onReloadSession,
  isLoading = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Timer state
  const [timer, setTimer] = useState(0);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && !isLoading) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session, isLoading]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
  };

  // Global stats state
  const [globalStats, setGlobalStats] = useState<{
    correct: number;
    wrong: number;
  } | null>(null);

  const loadGlobalStats = async () => {
    try {
      const stats = await api.getUserStats(userId);
      if (stats) {
        setGlobalStats({
          correct: stats.totalCorrect || 0,
          wrong: stats.totalWrong || 0,
        });
      }
    } catch (err) {
      console.error('Error loading global stats:', err);
    }
  };

  useEffect(() => {
    if (userId) {
      loadGlobalStats();
    }
  }, [userId, session?.id]);

  useEffect(() => {
    if (session) {
      setCurrentIndex(session.currentIndex || 0);
    }
  }, [session?.id, session?.currentIndex]);

  if (isLoading) {
    return (
      <div className="p-12 text-center max-w-xl mx-auto space-y-3">
        <div className="w-8 h-8 border-2 border-[#4ea1d3] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h3 className="text-base font-bold text-[#333]">Carregando sessão...</h3>
      </div>
    );
  }

  if (!session || !session.questions || session.questions.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded border border-[#e2e2e2] max-w-2xl mx-auto space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-[#e2e2e2] text-gray-800 flex items-center justify-center mx-auto">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#333]">
            Nenhuma questão disponível para os filtros selecionados
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onNavigateToDisciplines && (
            <button
              onClick={onNavigateToDisciplines}
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#333] border border-[#e2e2e2] rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Ver Todas Disciplinas</span>
            </button>
          )}
          <button
            onClick={onNavigateToImport}
            className="px-5 py-2.5 bg-[#4ea1d3] hover:bg-[#258bd5] text-white rounded text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Importar Questões JSON</span>
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentIndex];
  const answers = session.answers || {};
  const answerState = answers[currentQuestion.id];
  const total = session.questions.length;
  
  const isBookmarked = session.bookmarked?.[currentQuestion.id] || false;
  const needsReview = session.needsReview?.[currentQuestion.id] || false;

  const handleSubmitAnswer = async (selectedAnswer: OptionKey) => {
    if (isSubmitting || (session.mode === 'study' && answers[currentQuestion.id])) return;
    setIsSubmitting(true);
    try {
      const result = await api.submitAnswer({
        sessionId: session.id,
        questionId: currentQuestion.id,
        questionVersion: currentQuestion.version,
        selectedAnswer,
        responseTimeSeconds: 10,
        mode: session.mode,
        userId,
      });
      
      const newAnswers = { ...session.answers };
      newAnswers[currentQuestion.id] = result.answerState;
      
      // Update local global stats
      if (globalStats) {
         setGlobalStats({
             correct: globalStats.correct + (result.answerState.isCorrect ? 1 : 0),
             wrong: globalStats.wrong + (!result.answerState.isCorrect ? 1 : 0)
         });
      }

      onUpdateSession({
        ...session,
        answers: newAnswers,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onUpdateSession({ ...session, currentIndex: newIndex });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onUpdateSession({ ...session, currentIndex: newIndex });
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col font-sans">
      {/* Breadcrumbs and Timer */}
      <div className="flex items-center justify-between text-[#258bd5] text-[13px] mb-4">
        <div className="flex items-center gap-1">
          <span className="cursor-pointer hover:underline">Estudo</span>
          <span className="text-gray-400">&gt;</span>
          <span className="cursor-pointer hover:underline">Minhas pastas</span>
          <span className="text-gray-400">&gt;</span>
          <span className="cursor-pointer hover:underline">2. {session.filters.volume || 'Geral'}</span>
          <span className="text-gray-400">&gt;</span>
          <span className="cursor-pointer hover:underline text-gray-500">1. {session.filters.topic || 'Geral'}</span>
          <span className="text-red-500 font-bold ml-1 cursor-pointer hover:text-red-700 text-xs">❌</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Eye className="w-4 h-4 cursor-pointer hover:text-gray-800" />
          <span className="cursor-pointer hover:text-gray-800 tracking-tighter">↔</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">▶</span>
            <span className="font-mono text-[13px]">{formatTime(timer)}</span>
          </div>
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={total}
        answerState={answerState}
        isBookmarked={isBookmarked}
        needsReview={needsReview}
        mode={session.mode}
        isFinished={session.completed}
        onSelectOption={() => {}}
        onSubmitAnswer={handleSubmitAnswer}
        onToggleBookmark={() => {
            const newB = !isBookmarked;
            onUpdateSession({
              ...session,
              bookmarked: { ...session.bookmarked, [currentQuestion.id]: newB }
            });
            api.toggleFavorite({ userId, questionId: currentQuestion.id, bookmarked: newB, needsReview }).catch(console.error);
        }}
        onToggleReview={() => {}}
        onOpenReport={() => {}}
        onNext={handleNext}
        onPrev={handlePrev}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < total - 1}
        isSubmitting={isSubmitting}
        userId={userId}
        globalCorrect={globalStats?.correct || 0}
        globalWrong={globalStats?.wrong || 0}
      />
    </div>
  );
};
`;

fs.writeFileSync('src/views/StudyView.tsx', content, 'utf8');
console.log('StudyView updated');
