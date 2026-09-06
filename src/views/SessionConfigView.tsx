import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  GraduationCap,
  Timer,
  BookOpen,
  HelpCircle,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { SessionFilters, Difficulty, QuestionType, PersonalStatusFilter, OrderFilter } from '../types';
import { api } from '../services/api';

interface Props {
  onStartSession: (filters: SessionFilters) => void;
  initialMode?: 'study' | 'simulado';
  initialVolume?: string;
  isCreating?: boolean;
}

export const SessionConfigView: React.FC<Props> = ({
  onStartSession,
  initialMode = 'study',
  initialVolume,
  isCreating = false,
}) => {
  const [mode, setMode] = useState<'study' | 'simulado'>(initialMode);
  const [volume, setVolume] = useState<string>(initialVolume || 'todas');
  const [caderno, setCaderno] = useState<string>('todos');
  const [topic, setTopic] = useState<string>('todos');
  const [subtopic, setSubtopic] = useState<string>('todos');
  const [difficulty, setDifficulty] = useState<Difficulty | 'todas'>('todas');
  const [type, setType] = useState<QuestionType | 'todas'>('todas');
  const [personalStatus, setPersonalStatus] = useState<PersonalStatusFilter>('todas');
  const [order, setOrder] = useState<OrderFilter>('aleatoria');
  const [count, setCount] = useState<number>(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(0);

  const [meta, setMeta] = useState<{
    volumes: string[];
    cadernosByVolume?: Record<string, string[]>;
    topicsByVolume: Record<string, string[]>;
    topicsByVolumeCaderno?: Record<string, Record<string, string[]>>;
    subtopicsByTopic: Record<string, string[]>;
    totalQuestions: number;
  }>({
    volumes: [],
    cadernosByVolume: {},
    topicsByVolume: {},
    subtopicsByTopic: {},
    totalQuestions: 0,
  });

  useEffect(() => {
    api.getFiltersMeta().then((data) => {
      setMeta(data);
    }).catch(console.error);
  }, []);

  const handleVolumeChange = (newVol: string) => {
    setVolume(newVol);
    setCaderno('todos');
    setTopic('todos');
    setSubtopic('todos');
  };

  const handleCadernoChange = (newCaderno: string) => {
    setCaderno(newCaderno);
    setTopic('todos');
    setSubtopic('todos');
  };

  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
    setSubtopic('todos');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filters: SessionFilters = {
      volume: volume === 'todas' ? undefined : volume,
      caderno: caderno === 'todos' ? undefined : caderno,
      topic: topic === 'todos' ? undefined : topic,
      subtopic: subtopic === 'todos' ? undefined : subtopic,
      difficulty,
      type,
      personalStatus,
      order,
      count,
      mode,
      timeLimitMinutes: mode === 'simulado' && timeLimitMinutes > 0 ? timeLimitMinutes : undefined,
    };
    onStartSession(filters);
  };

  const availableCadernos = React.useMemo(() => {
    if (volume && volume !== 'todas') {
      return meta.cadernosByVolume?.[volume] || [];
    }
    const all = new Set<string>();
    Object.values(meta.cadernosByVolume || {}).forEach((cads: any) => {
      if (Array.isArray(cads)) {
        cads.forEach((c: string) => all.add(c));
      }
    });
    return Array.from(all);
  }, [volume, meta.cadernosByVolume]);

  const availableTopics = React.useMemo(() => {
    if (volume && volume !== 'todas') {
      if (caderno && caderno !== 'todos') {
         return meta.topicsByVolumeCaderno?.[volume]?.[caderno] || [];
      }
      return meta.topicsByVolume?.[volume] || [];
    }
    if (caderno && caderno !== 'todos' && meta.topicsByVolumeCaderno) {
      const topics = new Set<string>();
      Object.keys(meta.topicsByVolumeCaderno).forEach(vol => {
        const cads = meta.topicsByVolumeCaderno![vol];
        if (cads && cads[caderno]) {
          cads[caderno].forEach(t => topics.add(t));
        }
      });
      return Array.from(topics);
    }
    
    const allTopics = new Set<string>();
    if (meta.topicsByVolume) {
      Object.values(meta.topicsByVolume).forEach((topList: any) => {
        if (Array.isArray(topList)) {
          topList.forEach((t: string) => allTopics.add(t));
        }
      });
    }
    return Array.from(allTopics);
  }, [volume, caderno, meta.topicsByVolume, meta.topicsByVolumeCaderno]);

  const availableSubtopics = topic && topic !== 'todos' && meta.subtopicsByTopic?.[topic] ? meta.subtopicsByTopic[topic] : [];

  return (
    <div id="session-config-container" className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-[#EAE6DF] pb-4">
        <h1 className="font-editorial-heading text-2xl font-bold text-[#1A1A1A]">Montar Sessão de Questões</h1>
        <p className="font-editorial-serif text-sm text-[#57534E] mt-1">
          Selecione filtros avançados por disciplina fiscal, tópico, tipo de questão e status pessoal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            id="mode-study-selector"
            onClick={() => setMode('study')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
              mode === 'study'
                ? 'bg-[#FAF8F5] border-[#1C1917] ring-1 ring-[#1C1917]'
                : 'bg-white border-[#EAE6DF] hover:border-[#D6CEBE]'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${mode === 'study' ? 'bg-[#1C1917] text-[#FAF8F5]' : 'bg-[#FAF8F5] text-[#78716C] border border-[#EAE6DF]'}`}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-editorial-heading text-sm font-bold text-[#1A1A1A]">Modo Estudo</div>
              <div className="font-editorial-serif text-xs text-[#57534E] mt-1 leading-relaxed">
                Feedback imediato com gabarito seguro, fundamentação legal e comentários a cada questão respondida.
              </div>
            </div>
          </button>

          <button
            type="button"
            id="mode-simulado-selector"
            onClick={() => setMode('simulado')}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
              mode === 'simulado'
                ? 'bg-[#FAF8F5] border-[#1C1917] ring-1 ring-[#1C1917]'
                : 'bg-white border-[#EAE6DF] hover:border-[#D6CEBE]'
            }`}
          >
            <div className={`p-2.5 rounded-lg ${mode === 'simulado' ? 'bg-[#1C1917] text-[#FAF8F5]' : 'bg-[#FAF8F5] text-[#78716C] border border-[#EAE6DF]'}`}>
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="font-editorial-heading text-sm font-bold text-[#1A1A1A]">Modo Simulado</div>
              <div className="font-editorial-serif text-xs text-[#57534E] mt-1 leading-relaxed">
                Experiência de prova real: sem gabarito durante a resolução, com cronômetro e relatório consolidado pós-teste.
              </div>
            </div>
          </button>
        </div>

        {/* Filters Group 1: Disciplina & Tópicos */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
            1. Disciplina e Conteúdo Programático
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="volume-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                Disciplina
              </label>
              <select
                id="volume-select"
                value={volume}
                onChange={(e) => handleVolumeChange(e.target.value)}
                className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
              >
                <option value="todas">Todas as Disciplinas</option>
                {meta.volumes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="caderno-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                Caderno
              </label>
              <select
                id="caderno-select"
                value={caderno}
                disabled={availableCadernos.length === 0}
                onChange={(e) => handleCadernoChange(e.target.value)}
                className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white disabled:bg-[#FAF8F5] disabled:text-[#A8A29E] focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
              >
                <option value="todos">Todos os Cadernos</option>
                {availableCadernos.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="topic-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                Tópico
              </label>
              <select
                id="topic-select"
                value={topic}
                disabled={availableTopics.length === 0}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white disabled:bg-[#FAF8F5] disabled:text-[#A8A29E] focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
              >
                <option value="todos">Todos os Tópicos</option>
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subtopic-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                Subtópico
              </label>
              <select
                id="subtopic-select"
                value={subtopic}
                disabled={availableSubtopics.length === 0}
                onChange={(e) => setSubtopic(e.target.value)}
                className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white disabled:bg-[#FAF8F5] disabled:text-[#A8A29E] focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
              >
                <option value="todos">Todos os Subtópicos</option>
                {availableSubtopics.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filters Group 2: Dificuldade, Tipo e Status Pessoal */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
            2. Tipologia e Status Pessoal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="difficulty-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                Dificuldade
              </label>
              <select
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
              >
                <option value="todas">Todas as Dificuldades</option>
                <option value="facil">Fácil</option>
                <option value="media">Média</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>

            <div>
              <label htmlFor="type-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                Tipo de Questão
              </label>
              <select
                id="type-select"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
              >
                <option value="todas">Todos os Tipos</option>
                <option value="lei_seca">Lei Seca</option>
                <option value="conceitual">Doutrina / Conceitual</option>
                <option value="caso_pratico">Caso Prático</option>
                <option value="integracao">Integração de Conteúdo</option>
                <option value="prazo_numero">Prazos e Números</option>
                <option value="assertivas">Assertivas I-II-III</option>
              </select>
            </div>

            <div>
              <label htmlFor="personal-status-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                Status Pessoal
              </label>
              <select
                id="personal-status-select"
                value={personalStatus}
                onChange={(e) => setPersonalStatus(e.target.value as any)}
                className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
              >
                <option value="todas">Todas (Inéditas e já resolvidas)</option>
                <option value="ineditas">Apenas Inéditas</option>
                <option value="erradas">Apenas Questões que Errei</option>
                <option value="acertadas">Apenas Questões que Acertei</option>
                <option value="favoritas">Apenas Favoritas</option>
                <option value="revisao">Apenas Caderno de Revisão</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Group 3: Quantidade, Ordem e Cronômetro */}
        <div className="bg-white p-5 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#78716C] uppercase tracking-wider">
            3. Formato e Quantidade
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="count-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                Quantidade de Questões
              </label>
              <select
                id="count-select"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
              >
                <option value={5}>5 questões (rápida)</option>
                <option value={10}>10 questões (padrão)</option>
                <option value={15}>15 questões</option>
                <option value={20}>20 questões</option>
                <option value={30}>30 questões (simulado médio)</option>
                <option value={50}>50 questões (simulado completo)</option>
              </select>
            </div>

            <div>
              <label htmlFor="order-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                Ordenação
              </label>
              <select
                id="order-select"
                value={order}
                onChange={(e) => setOrder(e.target.value as any)}
                className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
              >
                <option value="aleatoria">Aleatória</option>
                <option value="recentes">Mais Recentes</option>
                <option value="antigas">Mais Antigas</option>
                <option value="maior_taxa_erro">Maior Taxa de Erro Pessoal</option>
              </select>
            </div>

            {mode === 'simulado' && (
              <div>
                <label htmlFor="timer-select" className="block text-xs font-semibold text-[#57534E] mb-1">
                  Tempo Limite (Cronômetro)
                </label>
                <select
                  id="timer-select"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full text-xs border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1C1917] bg-white focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] focus:outline-hidden"
                >
                  <option value={0}>Sem limite de tempo</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>60 minutos (1 hora)</option>
                  <option value={90}>90 minutos (1h30)</option>
                  <option value={120}>120 minutos (2 horas)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            id="start-configured-session-btn"
            disabled={isCreating}
            className="w-full sm:w-auto px-8 py-3 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] font-semibold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-[#FAF8F5]" />
            <span>{isCreating ? 'Iniciando Sessão...' : `Iniciar ${mode === 'simulado' ? 'Simulado' : 'Sessão de Estudos'}`}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

