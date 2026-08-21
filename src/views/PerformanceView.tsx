import React from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  BarChart3,
  Flame,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  PieChart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import type { GlobalUserStats } from '../types';

interface Props {
  stats: GlobalUserStats | null;
  onRetryQuestion: (questionId: string) => void;
  onStartConfig: () => void;
}

export const PerformanceView: React.FC<Props> = ({
  stats,
  onRetryQuestion,
  onStartConfig,
}) => {
  if (!stats) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-[#EAE6DF] max-w-xl mx-auto shadow-2xs">
        <p className="font-editorial-serif text-xs text-[#78716C]">Carregando dados de desempenho...</p>
      </div>
    );
  }

  // Format data for recharts
  const evolutionData = stats.evolutionData && stats.evolutionData.length > 0
    ? stats.evolutionData
    : [
        { date: 'Semana 1', accuracy: stats.globalAccuracy || 70, total: 10, correct: 7 },
        { date: 'Semana 2', accuracy: stats.globalAccuracy || 75, total: 15, correct: 11 },
        { date: 'Hoje', accuracy: stats.globalAccuracy || 80, total: 20, correct: 16 },
      ];

  const volumeChartData = (Object.entries(stats.volumeStats || {}) as Array<[string, { total: number; answered: number; correct: number; accuracy: number }]>).map(([name, data]) => ({
    name: name.length > 18 ? name.slice(0, 18) + '...' : name,
    fullName: name,
    accuracy: data.accuracy,
    answered: data.answered,
    correct: data.correct,
  }));

  const typeChartData = (Object.entries(stats.typeStats || {}) as Array<[string, { total: number; answered: number; correct: number; accuracy: number }]>).map(([key, data]) => {
    const labels: Record<string, string> = {
      lei_seca: 'Lei Seca',
      conceitual: 'Doutrina',
      caso_pratico: 'Caso Prático',
      integracao: 'Integração',
      prazo_numero: 'Prazos/Núm.',
      assertivas: 'Assertivas',
    };
    return {
      type: labels[key] || key,
      accuracy: data.accuracy,
      answered: data.answered,
    };
  });

  return (
    <div id="performance-view-container" className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#EAE6DF] pb-4">
        <h1 className="font-editorial-heading text-2xl font-bold text-[#1A1A1A]">Painel de Desempenho & Métricas</h1>
        <p className="font-editorial-serif text-sm text-[#57534E] mt-1">
          Acompanhamento analítico de precisão, evolução temporal e pontos fracos de conteúdo.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="text-xs text-[#78716C] font-medium">Aproveitamento Global</div>
          <div className="font-editorial-heading text-2xl sm:text-3xl font-bold text-[#1C1917] mt-1">{stats.globalAccuracy}%</div>
          <div className="text-[11px] text-[#A8A29E] mt-0.5 font-mono">
            {stats.totalCorrect} acertos / {stats.totalAttempts} total
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="text-xs text-[#78716C] font-medium">Questões Únicas</div>
          <div className="font-editorial-heading text-2xl sm:text-3xl font-bold text-[#1C1917] mt-1">{stats.uniqueQuestionsAnswered}</div>
          <div className="text-[11px] text-[#A8A29E] mt-0.5 font-mono">resolvidas do banco</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="text-xs text-[#78716C] font-medium">1ª Tentativa</div>
          <div className="font-editorial-heading text-2xl sm:text-3xl font-bold text-[#1C1917] mt-1">{stats.firstAttemptAccuracy}%</div>
          <div className="text-[11px] text-[#A8A29E] mt-0.5 font-mono">acerto em inéditas</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="text-xs text-[#78716C] font-medium">Última Tentativa</div>
          <div className="font-editorial-heading text-2xl sm:text-3xl font-bold text-[#15803D] mt-1">{stats.recentAttemptAccuracy}%</div>
          <div className="text-[11px] text-[#A8A29E] mt-0.5 font-mono">retenção de revisões</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution Chart */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
              Evolução Temporal (% de Acerto)
            </h3>
            <span className="text-[11px] font-mono text-[#78716C]">Histórico</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2ECE0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716C' }} stroke="#EAE6DF" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#78716C' }} stroke="#EAE6DF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FAF8F5', borderRadius: '8px', border: '1px solid #EAE6DF', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Aproveitamento']}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#1C1917"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1C1917' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accuracy by Volume */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
              Aproveitamento por Disciplina
            </h3>
            <span className="text-[11px] font-mono text-[#78716C]">% Acertos</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2ECE0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716C' }} stroke="#EAE6DF" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#78716C' }} stroke="#EAE6DF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FAF8F5', borderRadius: '8px', border: '1px solid #EAE6DF', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Precisão']}
                />
                <Bar dataKey="accuracy" fill="#44403C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown by Question Type & Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
          <h3 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
            Precisão por Nível de Dificuldade
          </h3>
          <div className="space-y-3">
            {[
              { key: 'facil', label: 'Fácil', data: stats.difficultyStats?.facil, color: 'bg-[#15803D]' },
              { key: 'media', label: 'Média', data: stats.difficultyStats?.media, color: 'bg-[#B45309]' },
              { key: 'dificil', label: 'Difícil', data: stats.difficultyStats?.dificil, color: 'bg-[#B91C1C]' },
            ].map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1A1A1A]">{item.label}</span>
                  <span className="font-mono font-semibold text-[#57534E]">
                    {item.data?.accuracy || 0}% ({item.data?.answered || 0} respondidas)
                  </span>
                </div>
                <div className="w-full bg-[#FAF8F5] border border-[#EAE6DF] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.data?.accuracy || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Type Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
          <h3 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
            Precisão por Tipo de Questão
          </h3>
          <div className="space-y-2.5">
            {typeChartData.map((item) => (
              <div key={item.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1A1A1A]">{item.type}</span>
                  <span className="font-mono font-semibold text-[#57534E]">
                    {item.accuracy}% ({item.answered} q.)
                  </span>
                </div>
                <div className="w-full bg-[#FAF8F5] border border-[#EAE6DF] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.accuracy >= 70 ? 'bg-[#15803D]' : item.accuracy >= 50 ? 'bg-[#B45309]' : 'bg-[#B91C1C]'
                    }`}
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Missed Questions (Caderno de Erros) */}
      <div className="bg-white p-6 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
            <h3 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
              Questões com Maior Índice de Erros Pessoais
            </h3>
          </div>
          <span className="text-xs font-mono text-[#78716C]">
            {stats.mostMissedQuestions.length} questões mapeadas
          </span>
        </div>

        {stats.mostMissedQuestions.length === 0 ? (
          <p className="font-editorial-serif text-xs text-[#78716C] py-4 text-center">
            Nenhum erro reincidente registrado ainda. Continue resolvendo questões!
          </p>
        ) : (
          <div className="space-y-2.5">
            {stats.mostMissedQuestions.map((q) => (
              <div
                key={q.questionId}
                className="p-3.5 bg-[#FAF8F5] hover:bg-[#F2ECE0] rounded-xl border border-[#EAE6DF] transition-colors flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#57534E]">
                    <span className="px-1.5 py-0.5 bg-white border border-[#D6CEBE] rounded font-mono text-[10px] text-[#1C1917]">
                      {q.questionId}
                    </span>
                    <span className="text-[#1A1A1A]">{q.volume}</span>
                    <span className="text-[#A8A29E]">•</span>
                    <span className="text-[#78716C]">{q.topic}</span>
                  </div>
                  <p className="font-editorial-serif text-xs text-[#1C1917] leading-snug line-clamp-2">
                    {q.statement}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#B91C1C]">
                      {q.wrongCount} erro{q.wrongCount > 1 ? 's' : ''}
                    </div>
                    <div className="text-[10px] font-mono text-[#A8A29E]">
                      em {q.totalAttempts} tentativas
                    </div>
                  </div>

                  <button
                    id={`retry-missed-btn-${q.questionId}`}
                    onClick={() => onRetryQuestion(q.questionId)}
                    className="px-3.5 py-1.5 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Treinar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

