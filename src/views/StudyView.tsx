import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  UploadCloud,
  Sparkles,
  BookOpen,
  Tag,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import type { StudySession, OptionKey, SessionAnswerState, SanitizedQuestion } from '../types';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionMap } from '../components/QuestionMap';
import { ReportIssueModal } from '../components/ReportIssueModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Global stats state
  const [globalStats, setGlobalStats] = useState<{
    correct: number;
    wrong: number;
    accuracy: number;
    totalAttempts: number;
  } | null>(null);

  const loadGlobalStats = async () => {
    try {
      const stats = await api.getUserStats(userId);
      if (stats) {
        setGlobalStats({
          correct: stats.totalCorrect || 0,
          wrong: stats.totalWrong || 0,
          accuracy: typeof stats.globalAccuracy === 'number' ? stats.globalAccuracy : 0,
          totalAttempts: stats.totalAttempts || 0,
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

  const [isResettingStats, setIsResettingStats] = useState(false);

  const handleResetGlobalStats = async () => {
    const confirmed = window.confirm(
      'Tem certeza de que deseja zerar o desempenho deste caderno? Seu histórico de acertos e erros para ele será apagado e a ordem das questões será reembaralhada.'
    );
    if (!confirmed) return;

    setIsResettingStats(true);
    try {
      await api.resetUserStats(userId, selectedVolume, selectedCaderno);
      await loadMeta();
      setGlobalStats({
        correct: 0,
        wrong: 0,
        accuracy: 0,
        totalAttempts: 0,
      });
      await onReloadSession();
    } catch (err) {
      alert('Erro ao zerar desempenho. Tente novamente.');
    } finally {
      setIsResettingStats(false);
    }
  };

  // Question Deletion in Study Session
  const [questionToDelete, setQuestionToDelete] = useState<SanitizedQuestion | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);

  // Filter metadata & state
  const [availableVolumes, setAvailableVolumes] = useState<string[]>([]);
  const [topicsByVolume, setTopicsByVolume] = useState<Record<string, string[]>>({});
  const [topicsByVolumeCaderno, setTopicsByVolumeCaderno] = useState<Record<string, Record<string, string[]>>>({});
  const [cadernosByVolume, setCadernosByVolume] = useState<Record<string, string[]>>({});
  const [cadernoCounts, setCadernoCounts] = useState<Record<string, Record<string, number>>>({});
  const [cadernoDoneCounts, setCadernoDoneCounts] = useState<Record<string, Record<string, number>>>({});
  const [topicCounts, setTopicCounts] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [topicDoneCounts, setTopicDoneCounts] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [allTopics, setAllTopics] = useState<string[]>([]);

  const [selectedVolume, setSelectedVolume] = useState<string>('todas');
  const [selectedCaderno, setSelectedCaderno] = useState<string>('todos');
  const [selectedTopic, setSelectedTopic] = useState<string>('todos');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('todas');
  const [selectedType, setSelectedType] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('todas');

  const loadMeta = async () => {
    try {
      const meta = await api.getFiltersMeta(userId);
      if (meta) {
        if (meta.volumes) setAvailableVolumes(meta.volumes);
        if (meta.cadernosByVolume) setCadernosByVolume(meta.cadernosByVolume);
        if (meta.cadernoCounts) setCadernoCounts(meta.cadernoCounts);
        if (meta.cadernoDoneCounts) setCadernoDoneCounts(meta.cadernoDoneCounts);
        if (meta.topicCounts) setTopicCounts(meta.topicCounts);
        if (meta.topicDoneCounts) setTopicDoneCounts(meta.topicDoneCounts);
        if (meta.topicsByVolumeCaderno) {
          setTopicsByVolumeCaderno(meta.topicsByVolumeCaderno);
        }
        if (meta.topicsByVolume) {
          setTopicsByVolume(meta.topicsByVolume);
          const allTopsSet = new Set<string>();
          Object.values(meta.topicsByVolume).forEach((topList: any) => {
            topList.forEach((t: string) => allTopsSet.add(t));
          });
          setAllTopics(Array.from(allTopsSet));
        }
      }
    } catch (err) {
      console.error('Error loading filters metadata:', err);
    }
  };

  // Load available volumes, cadernos and topics metadata
  useEffect(() => {
    loadMeta();
  }, [userId]);

  // Sync state when session changes
  useEffect(() => {
    if (session) {
      setCurrentIndex(session.currentIndex || 0);
      if (session.filters) {
        setSelectedVolume(session.filters.volume || 'todas');
        setSelectedCaderno(session.filters.caderno || 'todos');
        setSelectedTopic(session.filters.topic || 'todos');
        setSelectedDifficulty(session.filters.difficulty || 'todas');
        setSelectedType(session.filters.type || 'todas');
        setSelectedStatus(session.filters.personalStatus || 'todas');
      }
    }
  }, [session?.id]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  // Compute cadernos available for currently selected volume
  const currentAvailableCadernos = React.useMemo(() => {
    if (selectedVolume && selectedVolume !== 'todas') {
      return cadernosByVolume[selectedVolume] || [];
    }
    const allCadernos = new Set<string>();
    (Object.values(cadernosByVolume) as string[][]).forEach((cads) => {
      cads.forEach((c) => allCadernos.add(c));
    });
    return Array.from(allCadernos);
  }, [selectedVolume, cadernosByVolume]);

  // Compute topics available for currently selected volume
  const currentAvailableTopics = React.useMemo(() => {
        if (selectedVolume && selectedVolume !== 'todas') {
      if (selectedCaderno && selectedCaderno !== 'todos') {
         return topicsByVolumeCaderno[selectedVolume]?.[selectedCaderno] || [];
      }
      return topicsByVolume[selectedVolume] || [];
    }
    if (selectedCaderno && selectedCaderno !== 'todos') {
      // Find topics across all volumes that have this caderno
      const topics = new Set<string>();
      Object.keys(topicsByVolumeCaderno).forEach(vol => {
        const cads = topicsByVolumeCaderno[vol];
        if (cads && cads[selectedCaderno]) {
          cads[selectedCaderno].forEach(t => topics.add(t));
        }
      });
      return Array.from(topics);
    }
    return allTopics;
  }, [selectedVolume, selectedCaderno, topicsByVolume, topicsByVolumeCaderno, allTopics]);

  if (isLoading) {
    return (
      <div id="study-loading" className="p-12 text-center bg-white rounded-2xl border border-[#EAE6DF] max-w-xl mx-auto shadow-2xs space-y-3">
        <div className="w-8 h-8 border-2 border-[#1C1917] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Carregando sessão de estudo...</h3>
        <p className="font-editorial-serif text-xs text-[#78716C]">Buscando questões correspondentes no banco...</p>
      </div>
    );
  }

  if (!session || !session.questions || session.questions.length === 0) {
    return (
      <div id="study-empty-state" className="p-10 text-center bg-white rounded-2xl border border-[#EAE6DF] max-w-2xl mx-auto shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-[#1C1917] flex items-center justify-center mx-auto">
          <BookOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-editorial-heading text-xl font-bold text-[#1A1A1A]">
            Nenhuma questão disponível para os filtros selecionados
          </h3>
          <p className="font-editorial-serif text-xs text-[#78716C] max-w-md mx-auto">
            {selectedVolume !== 'todas'
              ? `Não foram encontradas questões para ${selectedVolume}${selectedTopic !== 'todos' ? ` › ${selectedTopic}` : ''}.`
              : 'Você pode ajustar os filtros acima ou importar novas questões em formato JSON para começar a resolver agora mesmo.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            id="reset-filters-empty-btn"
            onClick={() => {
              setSelectedVolume('todas');
              setSelectedCaderno('todos');
              setSelectedTopic('todos');
              setSelectedDifficulty('todas');
              setSelectedType('todas');
              setSelectedStatus('todas');
              onReloadSession({ volume: 'todas', caderno: 'todos', topic: 'todos', difficulty: 'todas', type: 'todas', personalStatus: 'todas' });
            }}
            className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C1917] border border-[#EAE6DF] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Limpar Filtros
          </button>

          {onNavigateToDisciplines && (
            <button
              onClick={onNavigateToDisciplines}
              className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C1917] border border-[#EAE6DF] rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Ver Todas Disciplinas</span>
            </button>
          )}

          <button
            id="go-import-empty-btn"
            onClick={onNavigateToImport}
            className="px-5 py-2.5 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 cursor-pointer transition-colors"
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
  const total = session.questions.length;
  const answeredCount = Object.keys(answers).length;
  const answerList = Object.values(answers) as SessionAnswerState[];
  const correctCount = answerList.filter((a) => a.isCorrect).length;
  const wrongCount = answerList.filter((a) => a.isCorrect === false).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  const handleApplyFilter = (vol: string, cad: string, top: string, diff: string, typ: string, stat: string) => {
    // Re-evaluate available topics for the new vol/cad selection
    let nextAvailableTopics: string[] = [];
    if (vol && vol !== 'todas') {
      if (cad && cad !== 'todos') {
         nextAvailableTopics = topicsByVolumeCaderno[vol]?.[cad] || [];
      } else {
         nextAvailableTopics = topicsByVolume[vol] || [];
      }
    } else if (cad && cad !== 'todos') {
      const topics = new Set<string>();
      Object.keys(topicsByVolumeCaderno).forEach(v => {
        if (topicsByVolumeCaderno[v] && topicsByVolumeCaderno[v][cad]) {
          topicsByVolumeCaderno[v][cad].forEach(t => topics.add(t));
        }
      });
      nextAvailableTopics = Array.from(topics);
    } else {
      nextAvailableTopics = allTopics;
    }

    // Reset topic if it is not found in the newly computed available topics
    let finalTopic = top;
    if (finalTopic !== 'todos' && !nextAvailableTopics.includes(finalTopic)) {
      finalTopic = 'todos';
    }

    setSelectedVolume(vol);
    setSelectedCaderno(cad);
    setSelectedTopic(finalTopic);
    setSelectedDifficulty(diff);
    setSelectedType(typ);
    setSelectedStatus(stat);

    onReloadSession({
      volume: vol !== 'todas' ? vol : undefined,
      caderno: cad !== 'todos' ? cad : undefined,
      topic: top !== 'todos' ? top : undefined,
      difficulty: diff,
      type: typ,
      personalStatus: stat,
      mode: 'study',
      order: 'aleatoria',
    });
  };

  const handleVolumeChange = (newVol: string) => {
    // Reset caderno and topic when volume changes
    handleApplyFilter(newVol, 'todos', 'todos', selectedDifficulty, selectedType, selectedStatus);
  };

  const handleCadernoChange = (newCad: string) => {
    // Reset topic when caderno changes
    handleApplyFilter(selectedVolume, newCad, 'todos', selectedDifficulty, selectedType, selectedStatus);
  };

  const handleTopicChange = (newTopic: string) => {
    handleApplyFilter(selectedVolume, selectedCaderno, newTopic, selectedDifficulty, selectedType, selectedStatus);
  };

  const handleShuffle = () => {
    onReloadSession({
      volume: selectedVolume !== 'todas' ? selectedVolume : undefined,
      caderno: selectedCaderno !== 'todos' ? selectedCaderno : undefined,
      topic: selectedTopic !== 'todos' ? selectedTopic : undefined,
      difficulty: selectedDifficulty,
      type: selectedType,
      personalStatus: selectedStatus,
      mode: 'study',
      order: 'aleatoria',
    });
  };

  const handleRestartAnswers = () => {
    const resetQuestions = session.questions.map((q) => ({
      ...q,
      userAnswer: undefined,
      isCorrect: undefined,
    }));
    const updatedSession: StudySession = {
      ...session,
      answers: {},
      questions: resetQuestions,
      currentIndex: 0,
    };
    setCurrentIndex(0);
    onUpdateSession(updatedSession);
  };

  const handleSubmitAnswer = async (opt: OptionKey) => {
    if (!currentQuestion || isSubmitting) return;
    setIsSubmitting(true);
    const responseTime = Math.round((Date.now() - questionStartTime) / 1000);

    try {
      const res = await api.submitAnswer({
        sessionId: session.id,
        questionId: currentQuestion.id,
        questionVersion: currentQuestion.version,
        selectedAnswer: opt,
        responseTimeSeconds: responseTime,
        mode: 'study',
        userId,
      });

      const updatedAnswers: Record<string, SessionAnswerState> = {
        ...answers,
        [currentQuestion.id]: {
          selectedAnswer: opt,
          isCorrect: res.isCorrect,
          correctAnswer: res.correctAnswer,
          explanation: res.explanation,
          legalBasis: res.legalBasis,
          timestamp: Date.now(),
          responseTimeSeconds: responseTime,
        },
      };

      const updatedQuestions = [...session.questions];
      updatedQuestions[currentIndex] = {
        ...currentQuestion,
        userAnswer: opt,
        isCorrect: res.isCorrect,
        answer: res.correctAnswer,
        explanation: res.explanation,
        legalBasis: res.legalBasis,
      };

      const updatedSession: StudySession = {
        ...session,
        answers: updatedAnswers,
        questions: updatedQuestions,
        currentIndex,
      };

      onUpdateSession(updatedSession);
      loadGlobalStats();
    } catch (err) {
      alert('Erro ao validar resposta no servidor.');
    } finally {
      setIsSubmitting(false);
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

  const handleDeleteQuestionConfirm = async () => {
    if (!questionToDelete || !session) return;
    setIsDeletingQuestion(true);
    try {
      await api.adminDeleteQuestion(questionToDelete.id);
      
      // Remove question locally from active session
      const remainingQuestions = session.questions.filter((q) => q.id !== questionToDelete.id);
      const remainingAnswers = { ...session.answers };
      delete remainingAnswers[questionToDelete.id];

      const newIndex = Math.min(currentIndex, Math.max(0, remainingQuestions.length - 1));
      
      const updatedSession: StudySession = {
        ...session,
        questions: remainingQuestions,
        answers: remainingAnswers,
        currentIndex: newIndex,
      };

      setCurrentIndex(newIndex);
      onUpdateSession(updatedSession);
      setQuestionToDelete(null);
    } catch (err: any) {
      alert('Erro ao excluir questão: ' + err.message);
    } finally {
      setIsDeletingQuestion(false);
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

  return (
    <div id="study-view-container" className="max-w-7xl mx-auto space-y-5">
      {/* Interactive Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1C1917]" />
            <span className="font-mono text-xs font-bold text-[#1C1917] uppercase tracking-wider">
              Filtro de Questões
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToDisciplines && (
              <button
                onClick={onNavigateToDisciplines}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C1917] border border-[#EAE6DF] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Explorar árvore temática de disciplinas e tópicos"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Explorar Tópicos</span>
              </button>
            )}

            <button
              id="shuffle-study-btn"
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C1917] border border-[#EAE6DF] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Embaralhar questões"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Embaralhar</span>
            </button>

            <button
              id="restart-study-btn"
              onClick={handleRestartAnswers}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C1917] border border-[#EAE6DF] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Limpar respostas e reiniciar este caderno"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Respostas</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns / Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 pt-1 text-xs font-mono">
          {/* Volume / Disciplina */}
          <div>
            <label className="block text-[11px] text-[#78716C] mb-1 font-semibold flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#1C1917]" />
              <span>Disciplina</span>
            </label>
            <select
              id="volume-filter-select"
              value={selectedVolume}
              onChange={(e) => handleVolumeChange(e.target.value)}
              className="w-full border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg px-2.5 py-1.5 text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
            >
              <option value="todas">Todas as Disciplinas</option>
              {availableVolumes.map((vol) => (
                <option key={vol} value={vol}>
                  {vol}
                </option>
              ))}
            </select>
          </div>

          {/* Caderno */}
          <div>
            <label className="block text-[11px] text-[#78716C] mb-1 font-semibold flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#1C1917]" />
              <span>Caderno</span>
            </label>
            <select
              id="caderno-filter-select"
              value={selectedCaderno}
              onChange={(e) => handleCadernoChange(e.target.value)}
              className="w-full border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg px-2.5 py-1.5 text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
            >
              <option value="todos">Todos os Cadernos</option>
              {currentAvailableCadernos.map((cad) => {
                let totalC = 0;
                let doneC = 0;
                if (selectedVolume !== 'todas') {
                  totalC = cadernoCounts[selectedVolume]?.[cad] || 0;
                  doneC = cadernoDoneCounts[selectedVolume]?.[cad] || 0;
                } else {
                  Object.keys(cadernoCounts).forEach((v) => {
                    totalC += cadernoCounts[v]?.[cad] || 0;
                    doneC += (cadernoDoneCounts && cadernoDoneCounts[v] && cadernoDoneCounts[v][cad]) ? cadernoDoneCounts[v][cad] : 0;
                  });
                }
                const label = totalC > 0 ? `${cad} (${doneC}/${totalC} feitas)` : cad;
                return (
                  <option key={cad} value={cad}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tópico */}
          <div>
            <label className="block text-[11px] text-[#78716C] mb-1 font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#1C1917]" />
              <span>Tópico / Assunto</span>
            </label>
            <select
              id="topic-filter-select"
              value={selectedTopic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="w-full border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg px-2.5 py-1.5 text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
            >
              <option value="todos">
                {selectedVolume !== 'todas' ? 'Todos os Tópicos da Disciplina' : 'Todos os Tópicos'}
              </option>
              {currentAvailableTopics.map((top) => {
                let totalC = 0;
                let doneC = 0;
                
                const processCaderno = (v, c) => {
                  totalC += (topicCounts && topicCounts[v] && topicCounts[v][c] && topicCounts[v][c][top]) ? topicCounts[v][c][top] : 0;
                  doneC += (topicDoneCounts && topicDoneCounts[v] && topicDoneCounts[v][c] && topicDoneCounts[v][c][top]) ? topicDoneCounts[v][c][top] : 0;
                };

                if (selectedVolume !== 'todas') {
                  if (selectedCaderno !== 'todos') {
                    processCaderno(selectedVolume, selectedCaderno);
                  } else {
                    Object.keys(cadernoCounts[selectedVolume] || {}).forEach(c => processCaderno(selectedVolume, c));
                  }
                } else {
                  Object.keys(topicCounts).forEach(v => {
                    if (selectedCaderno !== 'todos') {
                      processCaderno(v, selectedCaderno);
                    } else {
                      Object.keys(topicCounts[v] || {}).forEach(c => processCaderno(v, c));
                    }
                  });
                }
                
                const label = totalC > 0 ? `${top} (${doneC}/${totalC} feitas)` : top;
                return (
                  <option key={top} value={top}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Dificuldade */}
          <div>
            <label className="block text-[11px] text-[#78716C] mb-1 font-semibold">Dificuldade</label>
            <select
              id="difficulty-filter-select"
              value={selectedDifficulty}
              onChange={(e) => handleApplyFilter(selectedVolume, selectedCaderno, selectedTopic, e.target.value, selectedType, selectedStatus)}
              className="w-full border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg px-2.5 py-1.5 text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
            >
              <option value="todas">Todas as Dificuldades</option>
              <option value="facil">Fácil</option>
              <option value="media">Média</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>

          {/* Tipo de Questão */}
          <div>
            <label className="block text-[11px] text-[#78716C] mb-1 font-semibold">Tipo</label>
            <select
              id="type-filter-select"
              value={selectedType}
              onChange={(e) => handleApplyFilter(selectedVolume, selectedCaderno, selectedTopic, selectedDifficulty, e.target.value, selectedStatus)}
              className="w-full border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg px-2.5 py-1.5 text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
            >
              <option value="todas">Todos os Tipos</option>
              <option value="lei_seca">Lei Seca</option>
              <option value="conceitual">Doutrina / Conceitual</option>
              <option value="caso_pratico">Caso Prático</option>
              <option value="integracao">Integração</option>
              <option value="prazo_numero">Prazos e Números</option>
            </select>
          </div>

          {/* Status Pessoal */}
          <div>
            <label className="block text-[11px] text-[#78716C] mb-1 font-semibold">Status Pessoal</label>
            <select
              id="status-filter-select"
              value={selectedStatus}
              onChange={(e) => handleApplyFilter(selectedVolume, selectedCaderno, selectedTopic, selectedDifficulty, selectedType, e.target.value)}
              className="w-full border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg px-2.5 py-1.5 text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
            >
              <option value="todas">Todas as Questões</option>
              <option value="ineditas">Apenas Não Respondidas</option>
              <option value="erradas">Apenas Questões Erradas</option>
              <option value="caderno_erros">📕 Caderno de Erros (Pendentes)</option>
              <option value="acertadas">Apenas Questões Acertadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Real-time Session Metrics Card */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
        {/* Row 1: Caderno / Filtro Info & Local Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F2EDE4] pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">
                {selectedVolume !== 'todas' ? selectedVolume : 'Todas as Disciplinas'}
              </h2>
              {selectedCaderno !== 'todos' && (
                <span className="font-mono text-xs font-semibold text-[#B45309] bg-[#FFFBEB] px-2 py-0.5 rounded-md border border-[#FDE68A]">
                  📕 {selectedCaderno}
                </span>
              )}
              {selectedTopic !== 'todos' && (
                <span className="font-mono text-xs font-semibold text-[#57534E] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EAE6DF]">
                  › {selectedTopic}
                </span>
              )}
              <span className="font-mono text-[11px] bg-[#FAF8F5] text-[#78716C] px-2 py-0.5 rounded-md border border-[#EAE6DF]">
                {total} no caderno
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#78716C] mt-1 font-mono">
              <span>
                Questão <strong className="text-[#1C1917]">{currentIndex + 1}</strong> de <strong className="text-[#1C1917]">{total}</strong>
              </span>
              <span>•</span>
              <span>
                Respondidas no Caderno: <strong className="text-[#1C1917]">{answeredCount}</strong> / {total}
              </span>
            </div>
          </div>

          {/* Live Caderno Counters */}
          <div className="flex items-center gap-2 text-xs font-mono font-semibold flex-wrap">
            <span className="text-[10px] text-[#78716C] font-mono uppercase tracking-wider mr-0.5">Caderno Atual:</span>
            <div className="flex items-center gap-1 text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded-lg border border-[#BBF7D0]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{correctCount} acertos</span>
            </div>
            <div className="flex items-center gap-1 text-[#B91C1C] bg-[#FEF2F2] px-2.5 py-1 rounded-lg border border-[#FECACA]">
              <XCircle className="w-3.5 h-3.5" />
              <span>{wrongCount} erros</span>
            </div>
            <div className="text-[#1C1917] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#EAE6DF]">
              <span>{accuracy}% acerto</span>
            </div>
          </div>
        </div>

        {/* Row 2: Desempenho Geral - Independentemente do Caderno */}
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1C1917]" />
            <span className="font-mono text-xs font-bold text-[#1C1917] uppercase tracking-wider">
              Desempenho Geral (Todos os Cadernos)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold flex-wrap">
            <div className="flex items-center gap-1.5 text-[#15803D] bg-white px-3 py-1.5 rounded-lg border border-[#BBF7D0] shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              <span>ACERTOS GERAL: {globalStats?.correct ?? correctCount}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#B91C1C] bg-white px-3 py-1.5 rounded-lg border border-[#FECACA] shadow-2xs">
              <XCircle className="w-4 h-4 text-[#EF4444]" />
              <span>ERROS GERAL: {globalStats?.wrong ?? wrongCount}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#1C1917] text-[#FAF8F5] px-3.5 py-1.5 rounded-lg shadow-2xs">
              <span>PERCENTUAL - GERAL: {globalStats?.accuracy ?? accuracy}%</span>
            </div>

            <button
              type="button"
              id="reset-global-stats-btn"
              onClick={handleResetGlobalStats}
              disabled={isResettingStats}
              className="flex items-center gap-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] active:bg-[#FCA5A5] text-[#991B1B] border border-[#FECACA] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs disabled:opacity-50 ml-1"
              title="Zerar estatísticas deste caderno"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResettingStats ? 'animate-spin' : ''}`} />
              <span>{isResettingStats ? 'Zerando...' : 'Zerar Caderno'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EAE6DF] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#1C1917] h-full transition-all duration-300 rounded-full"
          style={{ width: `${Math.round(((currentIndex + 1) / total) * 100)}%` }}
        />
      </div>

      {/* Main Grid: Question Card + Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question Card Column */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <QuestionCard
            userId={userId}
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={total}
            answerState={answers[currentQuestion.id]}
            isBookmarked={!!session.bookmarked[currentQuestion.id]}
            needsReview={!!session.needsReview[currentQuestion.id]}
            mode="study"
            onSelectOption={() => {}}
            onSubmitAnswer={handleSubmitAnswer}
            onToggleBookmark={handleToggleBookmark}
            onToggleReview={handleToggleReview}
            onOpenReport={() => setReportModalOpen(true)}
            onDeleteQuestion={(q) => setQuestionToDelete(q)}
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={currentIndex < total - 1}
            hasPrev={currentIndex > 0}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Question Map / Palette Column */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <QuestionMap
            questions={session.questions}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
            answers={answers}
            bookmarked={session.bookmarked}
            needsReview={session.needsReview}
            mode="study"
          />

          <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-2 text-xs text-[#78716C]">
            <div className="font-mono font-bold text-[#1C1917] uppercase text-[10px] tracking-wider">
              Dica de Navegação Rápida
            </div>
            <p className="font-editorial-serif text-[#57534E] leading-relaxed text-xs">
              Pressione as teclas <strong className="font-mono text-[#1C1917]">A–E</strong> ou <strong className="font-mono text-[#1C1917]">1–5</strong> no teclado para marcar, <strong className="font-mono text-[#1C1917]">Enter</strong> para confirmar e as setas <strong className="font-mono text-[#1C1917]">← / →</strong> para navegar.
            </p>
          </div>
        </div>
      </div>

      {/* Report Issue Modal */}
      {currentQuestion && (
        <ReportIssueModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          questionId={currentQuestion.id}
          questionVersion={currentQuestion.version}
          userId={userId}
          userEmail={userEmail}
        />
      )}

      {/* Delete Question Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={handleDeleteQuestionConfirm}
        targetType="single"
        itemDetails={{
          id: questionToDelete?.id,
          statement: questionToDelete?.statement,
        }}
        isLoading={isDeletingQuestion}
      />
    </div>
  );
};
