import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Layers,
  Search,
  Play,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  Tag,
  Trash2,
} from 'lucide-react';
import type { DisciplineSummary, TopicSummary, DisciplinesMetaResponse } from '../types';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { api } from '../services/api';

interface Props {
  onSelectDiscipline: (disciplineName: string) => void;
  onSelectTopic: (disciplineName: string, topicName: string) => void;
  onNavigateToImport: () => void;
  onQuestionsModified?: () => void;
}

const toSlug = (text: any): string => {
  return String(text || 'item')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
};

const normalizeDiscipline = (d: any): DisciplineSummary => {
  if (!d) return { name: 'Geral', questionCount: 0, topics: [] };
  const name = typeof d === 'string' ? d : (d.name || d.volume || 'Geral');
  const questionCount = typeof d.questionCount === 'number' ? d.questionCount : 0;

  const rawCadernos = Array.isArray(d.cadernos) ? d.cadernos : [];
  const cadernos = rawCadernos.map((c: any) => {
    const cName = typeof c === 'string' ? c : (c?.name || 'Sem caderno');
    const cCount = typeof c?.questionCount === 'number' ? c.questionCount : 0;
    const rawTopics = Array.isArray(c?.topics) ? c.topics : [];
    const topics: TopicSummary[] = rawTopics.map((t: any) => ({
      name: String(typeof t === 'string' ? t : (t?.name || t?.topic || 'Geral')),
      questionCount: typeof t?.questionCount === 'number' ? t.questionCount : 0,
      subtopics: Array.isArray(t?.subtopics) ? t.subtopics.map((st: any) => String(st || '')) : [],
    }));
    return {
      name: String(cName),
      questionCount: cCount,
      topics,
    };
  });

  const rawTopics = Array.isArray(d.topics) ? d.topics : [];
  const topics: TopicSummary[] = rawTopics.map((t: any) => {
    const topicName = typeof t === 'string' ? t : (t?.name || t?.topic || 'Geral');
    const topicCount = typeof t?.questionCount === 'number' ? t.questionCount : 0;
    const subtopics = Array.isArray(t?.subtopics) ? t.subtopics.map((st: any) => String(st || '')) : [];
    return {
      name: String(topicName),
      questionCount: topicCount,
      subtopics,
    };
  });

  return {
    name: String(name),
    questionCount,
    cadernos,
    topics,
  };
};

export const DisciplinesTopicsView: React.FC<Props> = ({
  onSelectDiscipline,
  onSelectTopic,
  onNavigateToImport,
  onQuestionsModified,
}) => {
  const [data, setData] = useState<DisciplinesMetaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDisciplines, setExpandedDisciplines] = useState<Record<string, boolean>>({});

  // Deletion state
  const [disciplineToDelete, setDisciplineToDelete] = useState<DisciplineSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDisciplinesAndTopics();
      if (res && Array.isArray(res.disciplines)) {
        const normalizedDisciplines = res.disciplines.map(normalizeDiscipline);
        const normalizedData: DisciplinesMetaResponse = {
          ...res,
          disciplines: normalizedDisciplines,
        };
        setData(normalizedData);

        const initialExpanded: Record<string, boolean> = {};
        normalizedDisciplines.forEach((d) => {
          initialExpanded[d.name] = true;
        });
        setExpandedDisciplines(initialExpanded);
      } else {
        setData(res);
      }
    } catch (err) {
      console.error('Error loading disciplines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDisciplineConfirm = async () => {
    if (!disciplineToDelete) return;
    setIsDeleting(true);
    try {
      await api.adminDeleteByDiscipline(disciplineToDelete.name);
      setDisciplineToDelete(null);
      await loadData();
      if (onQuestionsModified) {
        onQuestionsModified();
      }
    } catch (err: any) {
      alert('Erro ao excluir disciplina: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExpand = (disciplineName: string) => {
    const key = String(disciplineName || '');
    setExpandedDisciplines((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    if (!data?.disciplines) return;
    const exp: Record<string, boolean> = {};
    data.disciplines.forEach((d) => {
      const name = String(d?.name || '');
      if (name) exp[name] = true;
    });
    setExpandedDisciplines(exp);
  };

  const collapseAll = () => {
    setExpandedDisciplines({});
  };

  // Filter disciplines and topics by search query
  const filteredDisciplines = useMemo(() => {
    if (!data?.disciplines || !Array.isArray(data.disciplines)) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data.disciplines;

    return data.disciplines
      .map((disc) => {
        const discName = String(disc?.name || '');
        const discMatch = discName.toLowerCase().includes(query);
        const topics = Array.isArray(disc?.topics) ? disc.topics : [];
        const matchingTopics = topics.filter(
          (top) => {
            const topName = String(top?.name || '');
            const subtopics = Array.isArray(top?.subtopics) ? top.subtopics : [];
            return (
              topName.toLowerCase().includes(query) ||
              subtopics.some((st) => String(st || '').toLowerCase().includes(query))
            );
          }
        );

        if (discMatch) {
          return disc;
        }

        if (matchingTopics.length > 0) {
          return {
            ...disc,
            topics: matchingTopics,
          };
        }

        return null;
      })
      .filter((d): d is DisciplineSummary => d !== null);
  }, [data, searchQuery]);

  if (isLoading) {
    return (
      <div id="disciplines-loading" className="p-12 text-center bg-white rounded-2xl border border-[#EAE6DF] max-w-xl mx-auto shadow-2xs space-y-3">
        <div className="w-8 h-8 border-2 border-[#1C1917] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Carregando catálogo temático...</h3>
        <p className="font-editorial-serif text-xs text-[#78716C]">Organizando disciplinas e tópicos cadastrados...</p>
      </div>
    );
  }

  const totalDisciplines = data?.disciplines?.length || 0;
  const totalTopics = data?.totalTopics || 0;
  const totalQuestions = data?.totalQuestions || 0;

  if (totalDisciplines === 0) {
    return (
      <div id="disciplines-empty-state" className="p-10 text-center bg-white rounded-2xl border border-[#EAE6DF] max-w-2xl mx-auto shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-[#1C1917] flex items-center justify-center mx-auto">
          <Layers className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-editorial-heading text-xl font-bold text-[#1A1A1A]">
            Nenhuma disciplina cadastrada ainda
          </h3>
          <p className="font-editorial-serif text-xs text-[#78716C] max-w-md mx-auto">
            Importe seu primeiro lote de questões em formato JSON para gerar automaticamente o mapa temático de disciplinas e tópicos.
          </p>
        </div>

        <button
          id="go-import-empty-disc-btn"
          onClick={onNavigateToImport}
          className="px-5 py-2.5 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-2xs inline-flex items-center gap-2 cursor-pointer transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Importar Questões JSON</span>
        </button>
      </div>
    );
  }

  return (
    <div id="disciplines-topics-view-container" className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <h1 className="font-editorial-heading text-2xl font-bold text-[#1A1A1A] flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#1C1917]" />
            <span>Disciplinas & Tópicos</span>
          </h1>
          <p className="font-editorial-serif text-xs text-[#78716C] mt-0.5">
            Navegue pela árvore temática das matérias fiscais e inicie sessões de estudo segmentadas por assunto.
          </p>
        </div>

        {/* Global Stats Badges */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 bg-white border border-[#EAE6DF] rounded-xl shadow-2xs text-[#1C1917] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#78716C]" />
            <span><strong>{totalDisciplines}</strong> matérias</span>
          </div>
          <div className="px-3 py-1.5 bg-white border border-[#EAE6DF] rounded-xl shadow-2xs text-[#1C1917] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#78716C]" />
            <span><strong>{totalTopics}</strong> tópicos</span>
          </div>
          <div className="px-3 py-1.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl shadow-2xs text-[#15803D] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse"></span>
            <span><strong>{totalQuestions}</strong> questões</span>
          </div>
        </div>
      </div>

      {/* Search & Collapse Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-disciplines-topics-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por disciplina, tópico (ex: Crédito Tributário, ICMS, Amostragem)..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs text-[#1A1A1A] placeholder-[#A8A29E] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#78716C] hover:text-[#1C1917] cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#57534E] border border-[#EAE6DF] rounded-lg transition-colors cursor-pointer"
          >
            Expandir Todos
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#57534E] border border-[#EAE6DF] rounded-lg transition-colors cursor-pointer"
          >
            Recolher Todos
          </button>
        </div>
      </div>

      {/* Disciplines Accordion List */}
      {filteredDisciplines.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs space-y-2">
          <p className="font-editorial-heading text-sm font-bold text-[#1A1A1A]">
            Nenhuma disciplina ou tópico correspondente a "{searchQuery}"
          </p>
          <p className="font-editorial-serif text-xs text-[#78716C]">
            Tente buscar por outro termo ou limpe a barra de pesquisa.
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 px-4 py-2 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C1917] border border-[#EAE6DF] rounded-xl text-xs font-mono font-medium cursor-pointer"
          >
            Limpar Busca
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisciplines.map((discipline) => {
            const discName = String(discipline?.name || 'Geral');
            const isExpanded = expandedDisciplines[discName] ?? true;
            const discSlug = toSlug(discName);
            const topicsList = Array.isArray(discipline?.topics) ? discipline.topics : [];

            return (
              <div
                key={discName}
                id={`discipline-card-${discSlug}`}
                className="bg-white rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-hidden transition-all"
              >
                {/* Discipline Header Card */}
                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-white hover:bg-[#FAF8F5]/60 transition-colors">
                  <div
                    onClick={() => toggleExpand(discName)}
                    className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-[240px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] text-[#1C1917] flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">
                          {discName}
                        </h2>
                        <span className="font-mono text-[11px] font-bold bg-[#FAF8F5] text-[#1C1917] px-2 py-0.5 rounded-md border border-[#EAE6DF]">
                          {discipline.questionCount || 0} questões
                        </span>
                      </div>
                      <div className="text-xs text-[#78716C] font-mono mt-0.5">
                        {topicsList.length} {topicsList.length === 1 ? 'tópico catalogado' : 'tópicos catalogados'}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center gap-2">
                    <button
                      id={`train-discipline-${discSlug}-btn`}
                      onClick={() => onSelectDiscipline(discName)}
                      className="px-3.5 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      title={`Resolver todas as questões de ${discName}`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Treinar</span>
                    </button>

                    <button
                      id={`delete-discipline-${discSlug}-btn`}
                      onClick={() => setDisciplineToDelete(discipline)}
                      className="p-2 text-[#A8A29E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-xl transition-colors cursor-pointer"
                      title={`Excluir questões de ${discName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleExpand(discName)}
                      className="p-2 text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE6DF] rounded-xl transition-colors cursor-pointer"
                      title={isExpanded ? 'Recolher tópicos' : 'Expandir tópicos'}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Cadernos / Topics Tree Body */}
                {isExpanded && (
                  <div className="border-t border-[#EAE6DF] bg-[#FAF8F5]/40 p-4 sm:p-5 space-y-4">
                    {discipline.cadernos && discipline.cadernos.length > 0 ? (
                      discipline.cadernos.map((caderno) => {
                        const cadName = caderno.name;
                        const cadSlug = toSlug(cadName);
                        const cadTopics = caderno.topics || [];

                        return (
                          <div
                            key={cadName}
                            id={`caderno-card-${cadSlug}`}
                            className="bg-white rounded-xl border border-[#EAE6DF] p-4 space-y-3 shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-[#F2EDE4] pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-md border border-[#FDE68A] font-editorial-heading">
                                  {cadName}
                                </span>
                                <span className="text-xs font-mono text-[#78716C]">
                                  ({caderno.questionCount} {caderno.questionCount === 1 ? 'questão' : 'questões'})
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {cadTopics.map((topic) => {
                                const topName = String(topic?.name || 'Geral');
                                const topSlug = toSlug(topName);
                                const subtopics = Array.isArray(topic?.subtopics) ? topic.subtopics : [];

                                return (
                                  <div
                                    key={topName}
                                    id={`topic-item-${topSlug}`}
                                    className="p-3 bg-[#FAF8F5]/60 border border-[#EAE6DF] rounded-lg flex flex-col justify-between hover:border-[#D6CEBE] hover:bg-white transition-all space-y-2.5"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="space-y-1">
                                        <div className="font-editorial-heading text-xs sm:text-sm font-bold text-[#1A1A1A] leading-snug">
                                          {topName}
                                        </div>
                                        <span className="inline-block font-mono text-[10px] font-bold bg-white text-[#57534E] px-2 py-0.5 rounded border border-[#EAE6DF]">
                                          {topic.questionCount || 0} {topic.questionCount === 1 ? 'questão' : 'questões'}
                                        </span>
                                      </div>

                                      <button
                                        id={`train-topic-${topSlug}-btn`}
                                        onClick={() => onSelectTopic(discName, topName)}
                                        className="shrink-0 px-2.5 py-1 bg-white hover:bg-[#1C1917] text-[#1C1917] hover:text-[#FAF8F5] border border-[#EAE6DF] hover:border-[#1C1917] rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs group"
                                        title={`Treinar questões de ${topName}`}
                                      >
                                        <Play className="w-3 h-3 fill-current text-[#1C1917] group-hover:text-[#FAF8F5]" />
                                        <span>Resolver</span>
                                      </button>
                                    </div>

                                    {/* Subtopics chips if any */}
                                    {subtopics.length > 0 && (
                                      <div className="flex flex-wrap gap-1 pt-1 border-t border-[#F2EDE4]">
                                        {subtopics.map((st) => (
                                          <span
                                            key={String(st)}
                                            className="text-[10px] font-editorial-serif text-[#78716C] bg-white px-1.5 py-0.5 rounded border border-[#EAE6DF]"
                                          >
                                            • {String(st)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div className="text-[11px] font-mono font-bold text-[#78716C] uppercase tracking-wider mb-2">
                          Tópicos & Assuntos ({topicsList.length})
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {topicsList.map((topic) => {
                            const topName = String(topic?.name || 'Geral');
                            const topSlug = toSlug(topName);
                            const subtopics = Array.isArray(topic?.subtopics) ? topic.subtopics : [];

                            return (
                              <div
                                key={topName}
                                id={`topic-item-${topSlug}`}
                                className="p-3.5 bg-white border border-[#EAE6DF] rounded-xl flex flex-col justify-between hover:border-[#D6CEBE] hover:shadow-2xs transition-all space-y-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="font-editorial-heading text-sm font-bold text-[#1A1A1A] leading-snug">
                                      {topName}
                                    </div>
                                    <span className="inline-block font-mono text-[10px] font-bold bg-[#FAF8F5] text-[#57534E] px-2 py-0.5 rounded border border-[#EAE6DF]">
                                      {topic.questionCount || 0} {topic.questionCount === 1 ? 'questão' : 'questões'}
                                    </span>
                                  </div>

                                  <button
                                    id={`train-topic-${topSlug}-btn`}
                                    onClick={() => onSelectTopic(discName, topName)}
                                    className="shrink-0 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#1C1917] text-[#1C1917] hover:text-[#FAF8F5] border border-[#EAE6DF] hover:border-[#1C1917] rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
                                    title={`Treinar questões de ${topName}`}
                                  >
                                    <Play className="w-3 h-3 fill-current text-[#1C1917] group-hover:text-[#FAF8F5]" />
                                    <span>Resolver</span>
                                  </button>
                                </div>

                                {/* Subtopics chips if any */}
                                {subtopics.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#F2EDE4]">
                                    {subtopics.map((st) => (
                                      <span
                                        key={String(st)}
                                        className="text-[10px] font-editorial-serif text-[#78716C] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EAE6DF]"
                                      >
                                        • {String(st)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Discipline Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!disciplineToDelete}
        onClose={() => setDisciplineToDelete(null)}
        onConfirm={handleDeleteDisciplineConfirm}
        targetType="discipline"
        itemDetails={{
          disciplineName: disciplineToDelete?.name,
          count: disciplineToDelete?.questionCount,
        }}
        isLoading={isDeleting}
      />
    </div>
  );
};
