import React, { useState, useEffect } from 'react';
import {
  BookX,
  AlertCircle,
  CheckCircle2,
  Play,
  Search,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Tag,
  Clock,
  Filter,
} from 'lucide-react';
import type { ErrorNotebookSummary, ErrorNotebookItem } from '../types';
import { api } from '../services/api';

interface Props {
  userId: string;
  onStartSessionWithErrors: (filters?: any) => void;
}

export const ErrorNotebookView: React.FC<Props> = ({
  userId,
  onStartSessionWithErrors,
}) => {
  const [notebook, setNotebook] = useState<ErrorNotebookSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ativo' | 'superado' | 'todos'>('ativo');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('todas');
  const [selectedCaderno, setSelectedCaderno] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  const fetchNotebook = async () => {
    setIsLoading(true);
    try {
      const data = await api.getErrorNotebook(userId);
      setNotebook(data);
    } catch (err) {
      console.error('Erro ao carregar caderno de erros:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebook();
  }, [userId]);

  const handleSaveNote = async (questionId: string) => {
    try {
      await api.updateErrorNote({
        userId,
        questionId,
        userNotes: tempNote,
      });
      setEditingNoteId(null);
      fetchNotebook();
    } catch (err) {
      alert('Erro ao salvar anotação do caderno de erros');
    }
  };

  const handleToggleStatus = async (questionId: string, currentStatus: 'ativo' | 'superado') => {
    const newStatus = currentStatus === 'ativo' ? 'superado' : 'ativo';
    try {
      await api.updateErrorStatus({
        userId,
        questionId,
        status: newStatus,
      });
      fetchNotebook();
    } catch (err) {
      alert('Erro ao alterar status no caderno de erros');
    }
  };

  // Filter items
  const items = notebook?.items || [];
  const filteredItems = items.filter((item) => {
    if (statusFilter === 'ativo' && item.status !== 'ativo') return false;
    if (statusFilter === 'superado' && item.status !== 'superado') return false;

    if (selectedDiscipline !== 'todas') {
      const qVol = (item.question.volume || '').trim().toLowerCase();
      if (qVol !== selectedDiscipline.trim().toLowerCase()) return false;
    }

    if (selectedCaderno !== 'todos') {
      const qCad = (item.question.caderno || 'Sem caderno').trim().toLowerCase();
      if (qCad !== selectedCaderno.trim().toLowerCase()) return false;
    }

    if (search) {
      const s = search.toLowerCase();
      const q = item.question;
      const notes = (item.userNotes || '').toLowerCase();
      return (
        q.statement.toLowerCase().includes(s) ||
        q.topic.toLowerCase().includes(s) ||
        q.volume.toLowerCase().includes(s) ||
        (q.caderno && q.caderno.toLowerCase().includes(s)) ||
        q.id.toLowerCase().includes(s) ||
        notes.includes(s)
      );
    }

    return true;
  });

  // Extract list of unique disciplines and cadernos in the notebook
  const disciplinesList = Array.from(new Set(items.map((i) => i.question.volume).filter(Boolean)));
  const cadernosList = Array.from(new Set(items.map((i) => i.question.caderno || 'Sem caderno').filter(Boolean)));

  const handleStartPractice = () => {
    onStartSessionWithErrors({
      volume: selectedDiscipline !== 'todas' ? selectedDiscipline : undefined,
      caderno: selectedCaderno !== 'todos' ? selectedCaderno : undefined,
      personalStatus: 'caderno_erros',
      mode: 'study',
    });
  };

  return (
    <div id="error-notebook-view-container" className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#991B1B]/10 border border-[#FECACA] flex items-center justify-center text-[#991B1B]">
              <BookX className="w-4 h-4" />
            </div>
            <h1 className="font-editorial-heading text-2xl font-bold text-[#1A1A1A]">Caderno de Erros</h1>
          </div>
          <p className="font-editorial-serif text-xs text-[#78716C] mt-1">
            Registro inteligente de todas as questões respondidas incorretamente para revisão focada e superação.
          </p>
        </div>

        {items.length > 0 && (
          <button
            id="start-error-session-btn"
            onClick={handleStartPractice}
            className="px-4 py-2.5 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-[#FAF8F5]" />
            <span>Treinar Questões do Caderno ({notebook?.activeErrorsCount || 0} Ativas)</span>
          </button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#78716C] uppercase tracking-wider block">
              Total Registrado
            </span>
            <span className="font-editorial-heading text-2xl font-bold text-[#1C1917]">
              {notebook?.totalUniqueErrors || 0}
            </span>
            <span className="text-[11px] text-[#A8A29E] block mt-0.5">questões com erros registrados</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] flex items-center justify-center text-[#78716C]">
            <BookX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#FFFBEB] p-4 rounded-xl border border-[#FDE68A] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#B45309] uppercase tracking-wider block">
              Ativas para Revisão
            </span>
            <span className="font-editorial-heading text-2xl font-bold text-[#92400E]">
              {notebook?.activeErrorsCount || 0}
            </span>
            <span className="text-[11px] text-[#B45309]/80 block mt-0.5">pendentes de nova tentativa</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309]">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#F0FDF4] p-4 rounded-xl border border-[#BBF7D0] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#15803D] uppercase tracking-wider block">
              Superadas / Dominadas
            </span>
            <span className="font-editorial-heading text-2xl font-bold text-[#166534]">
              {notebook?.superadoCount || 0}
            </span>
            <span className="text-[11px] text-[#15803D]/80 block mt-0.5">re-acertadas com sucesso</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#15803D]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-2.5" />
            <input
              id="search-error-notebook-input"
              type="text"
              placeholder="Buscar por termo, disciplina, tópico ou anotação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg pl-9 pr-3 py-2 text-[#1A1A1A] placeholder-[#A8A29E] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917] focus:bg-white transition-colors"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 border border-[#EAE6DF] rounded-lg text-xs font-mono font-medium">
            <button
              onClick={() => setStatusFilter('ativo')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'ativo'
                  ? 'bg-[#FEF3C7] text-[#92400E] shadow-2xs font-bold border border-[#FDE68A]'
                  : 'text-[#78716C]'
              }`}
            >
              Ativos ({notebook?.activeErrorsCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter('superado')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'superado'
                  ? 'bg-[#DCFCE7] text-[#166534] shadow-2xs font-bold border border-[#BBF7D0]'
                  : 'text-[#78716C]'
              }`}
            >
              Superados ({notebook?.superadoCount || 0})
            </button>
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-white text-[#1C1917] shadow-2xs font-bold border border-[#EAE6DF]'
                  : 'text-[#78716C]'
              }`}
            >
              Todos ({notebook?.totalUniqueErrors || 0})
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F2EDE4]">
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#78716C] mb-1 uppercase">
              Filtrar por Disciplina:
            </label>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full text-xs border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg p-2 text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
            >
              <option value="todas">Todas as Disciplinas</option>
              {disciplinesList.map((disc) => (
                <option key={disc} value={disc}>
                  {disc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-[#78716C] mb-1 uppercase">
              Filtrar por Caderno:
            </label>
            <select
              value={selectedCaderno}
              onChange={(e) => setSelectedCaderno(e.target.value)}
              className="w-full text-xs border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg p-2 text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
            >
              <option value="todos">Todos os Cadernos</option>
              {cadernosList.map((cad) => (
                <option key={cad} value={cad}>
                  {cad}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-xl border border-[#EAE6DF] text-xs font-mono text-[#78716C]">
          Carregando caderno de erros...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#EAE6DF] text-[#A8A29E] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[#16A34A]" />
          </div>
          <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">
            Nenhuma questão encontrada com esses filtros!
          </h3>
          <p className="font-editorial-serif text-xs text-[#78716C] max-w-sm mx-auto leading-relaxed">
            {items.length === 0
              ? 'Você ainda não possui erros registrados. Continue praticando para acumular seu histórico de revisão.'
              : 'Altere os filtros de disciplina, caderno ou busca acima para visualizar mais questões.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const q = item.question;
            const isSuperado = item.status === 'superado';

            return (
              <div
                key={q.id}
                id={`error-card-${q.id}`}
                className={`bg-white p-5 rounded-xl border shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3.5 transition-all ${
                  isSuperado ? 'border-[#BBF7D0] bg-[#F0FDF4]/30' : 'border-[#EAE6DF]'
                }`}
              >
                {/* Card Top Metadata Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2EDE4] pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isSuperado
                          ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
                          : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                      }`}
                    >
                      {isSuperado ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                          <span>Superado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-[#B45309]" />
                          <span>Pendente</span>
                        </>
                      )}
                    </span>

                    {/* Discipline Badge */}
                    <span className="text-xs font-bold text-[#1C1917]">{q.volume}</span>

                    {/* Caderno Badge */}
                    {q.caderno && (
                      <>
                        <span className="text-[#D6D3D1]">•</span>
                        <span className="text-[10px] font-mono font-bold bg-[#FFFBEB] text-[#B45309] px-1.5 py-0.5 rounded border border-[#FDE68A]">
                          {q.caderno}
                        </span>
                      </>
                    )}

                    <span className="text-[#D6D3D1]">•</span>
                    <span className="text-xs text-[#57534E]">{q.topic}</span>
                    <span className="text-[#D6D3D1]">•</span>
                    <span className="text-[10px] font-mono text-[#A8A29E]">ID: {q.id}</span>
                  </div>

                  {/* Error statistics pill */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold bg-[#FAF8F5] text-[#57534E] border border-[#EAE6DF] px-2 py-0.5 rounded-md">
                      {item.totalErrors} {item.totalErrors === 1 ? 'erro' : 'erros'}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(q.id, item.status)}
                      className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                        isSuperado
                          ? 'bg-white text-[#78716C] border-[#EAE6DF] hover:bg-[#FAF8F5]'
                          : 'bg-[#166534] text-white border-[#166534] hover:bg-[#15803D]'
                      }`}
                    >
                      {isSuperado ? 'Reativar Erro' : 'Marcar como Superado'}
                    </button>
                  </div>
                </div>

                {/* Statement */}
                <p className="font-editorial-serif text-sm text-[#1A1A1A] leading-relaxed line-clamp-3">
                  {q.statement}
                </p>

                {/* User Error Note Section */}
                {editingNoteId === q.id ? (
                  <div className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl space-y-2">
                    <label className="block text-[11px] font-mono font-bold text-[#1C1917]">
                      Minha Anotação de Aprendizado / Causa do Erro:
                    </label>
                    <textarea
                      rows={2}
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="Ex: Errei por atentar mal à exceção do artigo X..."
                      className="w-full text-xs p-2 bg-white border border-[#EAE6DF] rounded-md text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-2.5 py-1 text-[11px] text-[#78716C] hover:bg-[#EAE6DF] rounded-md transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveNote(q.id)}
                        className="px-3 py-1 text-[11px] font-semibold bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Salvar Anotação</span>
                      </button>
                    </div>
                  </div>
                ) : item.userNotes ? (
                  <div className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl text-xs flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-[#78716C] text-[10px] uppercase block">
                        Anotação de Aprendizado:
                      </span>
                      <p className="font-editorial-serif italic text-xs text-[#292524]">
                        {item.userNotes}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingNoteId(q.id);
                        setTempNote(item.userNotes || '');
                      }}
                      className="p-1 text-[#78716C] hover:text-[#1C1917] rounded-md transition-colors cursor-pointer"
                      title="Editar anotação"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingNoteId(q.id);
                      setTempNote('');
                    }}
                    className="text-[11px] font-mono text-[#78716C] hover:text-[#1C1917] flex items-center gap-1 py-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>+ Adicionar anotação de aprendizado para esta questão</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
