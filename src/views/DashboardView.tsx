import React from 'react';
import {
  GraduationCap,
  Timer,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Target,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  BookMarked,
  Scroll,
} from 'lucide-react';
import type { GlobalUserStats, StudySession } from '../types';

interface Props {
  stats: GlobalUserStats | null;
  activeSession: StudySession | null;
  onStartQuickStudy: (volume?: string) => void;
  onStartSimulado: () => void;
  onStartMistakesReview: () => void;
  onOpenConfig: () => void;
  onResumeSession: () => void;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  stats,
  activeSession,
  onStartQuickStudy,
  onStartSimulado,
  onStartMistakesReview,
  onOpenConfig,
  onResumeSession,
  onNavigate,
}) => {
  const globalAcc = stats?.globalAccuracy || 0;
  const uniqueCount = stats?.uniqueQuestionsAnswered || 0;
  const totalAttempts = stats?.totalAttempts || 0;
  const totalCorrect = stats?.totalCorrect || 0;

  return (
    <div id="dashboard-view-container" className="space-y-8 max-w-4xl mx-auto">
      {/* Active session banner if exists */}
      {activeSession && !activeSession.completed && (
        <div
          id="active-session-resume-banner"
          className="p-5 sm:p-6 bg-[#1C1917] rounded-xl text-[#FAF8F5] shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-[#292524] flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FAF8F5]/15 text-[#EAE5D9] rounded-sm text-[10px] font-mono uppercase tracking-wider">
              {activeSession.mode === 'simulado' ? 'Simulado em Andamento' : 'Sessão em Andamento'}
            </div>
            <h3 className="font-editorial-heading text-lg sm:text-xl font-bold text-[#FDFCF8]">{activeSession.title}</h3>
            <p className="text-xs text-[#D6CEBE]">
              Progresso: {Object.keys(activeSession.answers).length} de {activeSession.questions.length} questões respondidas
            </p>
          </div>
          <button
            id="resume-active-session-btn"
            onClick={onResumeSession}
            className="px-5 py-2.5 bg-[#FAF8F5] text-[#1C1917] hover:bg-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Continuar Agora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main stats cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
            Seu Desempenho Global
          </h2>
          <button
            id="view-full-performance-btn"
            onClick={() => onNavigate('performance')}
            className="text-xs font-medium text-[#1C1917] hover:text-[#B45309] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver Estatísticas Detalhadas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="text-xs text-[#78716C] font-medium">Aproveitamento</div>
            <div className="font-editorial-heading text-2xl sm:text-3xl font-bold text-[#1C1917] mt-1">{globalAcc}%</div>
            <div className="text-[11px] text-[#A8A29E] mt-0.5">Média geral de acertos</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="text-xs text-[#78716C] font-medium">Questões Únicas</div>
            <div className="font-editorial-heading text-2xl sm:text-3xl font-bold text-[#1C1917] mt-1">{uniqueCount}</div>
            <div className="text-[11px] text-[#A8A29E] mt-0.5">Questões resolvidas</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="text-xs text-[#78716C] font-medium">Total de Resoluções</div>
            <div className="font-editorial-heading text-2xl sm:text-3xl font-bold text-[#1C1917] mt-1">{totalAttempts}</div>
            <div className="text-[11px] text-[#A8A29E] mt-0.5">Tentativas registradas</div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="text-xs text-[#78716C] font-medium">Total de Acertos</div>
            <div className="font-editorial-heading text-2xl sm:text-3xl font-bold text-[#15803D] mt-1">{totalCorrect}</div>
            <div className="text-[11px] text-[#A8A29E] mt-0.5">Gabaritos corretos</div>
          </div>
        </div>
      </div>

      {/* Quick start actions */}
      <div>
        <h2 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider mb-3.5">
          Cadernos de Questões & Treino
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Study Mode */}
          <div
            id="quick-start-study-card"
            onClick={() => onStartQuickStudy()}
            className="p-5 bg-white rounded-xl border border-[#EAE6DF] hover:border-[#B45309]/50 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] text-[#1C1917] border border-[#EAE6DF] flex items-center justify-center group-hover:bg-[#1C1917] group-hover:text-[#FAF8F5] transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Modo Estudo</h3>
                <p className="font-editorial-serif text-xs text-[#57534E] mt-1 leading-relaxed">
                  Resolva questão por questão com validação de gabarito em tempo real, fundamentação legal e comentários didáticos.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F2ECE0] flex items-center justify-between text-xs font-semibold text-[#1C1917] group-hover:text-[#B45309] transition-colors">
              <span>Iniciar 10 questões</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Simulado */}
          <div
            id="quick-start-simulado-card"
            onClick={onStartSimulado}
            className="p-5 bg-white rounded-xl border border-[#EAE6DF] hover:border-[#B45309]/50 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] text-[#1C1917] border border-[#EAE6DF] flex items-center justify-center group-hover:bg-[#1C1917] group-hover:text-[#FAF8F5] transition-colors">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Simulado com Prova</h3>
                <p className="font-editorial-serif text-xs text-[#57534E] mt-1 leading-relaxed">
                  Simule o dia da prova real: sem gabarito imediato, com cronômetro, revisão de respostas e relatório consolidado pós-teste.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F2ECE0] flex items-center justify-between text-xs font-semibold text-[#1C1917] group-hover:text-[#B45309] transition-colors">
              <span>Configurar Simulado</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Custom Session */}
          <div
            id="quick-start-custom-card"
            onClick={onOpenConfig}
            className="p-5 bg-white rounded-xl border border-[#EAE6DF] hover:border-[#B45309]/50 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] text-[#1C1917] border border-[#EAE6DF] flex items-center justify-center group-hover:bg-[#1C1917] group-hover:text-[#FAF8F5] transition-colors">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Filtros Avançados</h3>
                <p className="font-editorial-serif text-xs text-[#57534E] mt-1 leading-relaxed">
                  Filtre por matéria fiscal, tópico, subtópico, dificuldade, lei seca, assertivas ou status pessoal (inéditas / erradas).
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F2ECE0] flex items-center justify-between text-xs font-semibold text-[#1C1917] group-hover:text-[#B45309] transition-colors">
              <span>Personalizar Sessão</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Mastery by Volume / Caderno */}
      {stats?.volumeStats && Object.keys(stats.volumeStats).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
            Aproveitamento por Disciplina Fiscal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(stats.volumeStats) as Array<[string, { total: number; answered: number; correct: number; accuracy: number }]>).map(([volume, vData]) => (
              <div
                key={volume}
                id={`volume-card-${volume.replace(/\s+/g, '-').toLowerCase()}`}
                className="p-4 bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="font-editorial-heading text-xs font-bold text-[#1A1A1A]">{volume}</div>
                  <div className="text-[11px] text-[#78716C] font-normal">
                    {vData.answered} respondidas de {vData.total} disponíveis ({vData.correct} acertos)
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#FAF8F5] border border-[#EAE6DF] h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${
                        vData.accuracy >= 75
                          ? 'bg-[#15803D]'
                          : vData.accuracy >= 50
                          ? 'bg-[#B45309]'
                          : 'bg-[#D97706]'
                      }`}
                      style={{ width: `${Math.min(100, vData.accuracy || 0)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-editorial-heading text-lg font-bold text-[#1C1917]">{vData.accuracy}%</div>
                  <button
                    id={`study-volume-btn-${volume.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => onStartQuickStudy(volume)}
                    className="text-[11px] font-semibold text-[#B45309] hover:underline mt-0.5 block cursor-pointer"
                  >
                    Treinar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

