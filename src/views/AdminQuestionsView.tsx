import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Edit2,
  Copy,
  Power,
  History,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import type { Question, QuestionVersionSnapshot, QuestionStatus, Difficulty, QuestionType, OptionKey } from '../types';
import { QualityAuditBadge } from '../components/QualityAuditBadge';
import { DeleteConfirmModal, type DeleteTargetType } from '../components/DeleteConfirmModal';
import { auditSingleQuestion } from '../lib/audit';
import { api } from '../services/api';

export const AdminQuestionsView: React.FC = () => {
  const [questions, setQuestions] = useState<(Question & { auditWarnings?: any[] })[]>([]);
  const [metaCounts, setMetaCounts] = useState<{ totalDatabase: number; addedCount: number; seedCount: number }>({
    totalDatabase: 0,
    addedCount: 0,
    seedCount: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [volumeFilter, setVolumeFilter] = useState<string>('todas');
  const [originFilter, setOriginFilter] = useState<string>('todas'); // 'todas' | 'adicionadas' | 'padrao'
  const [isLoading, setIsLoading] = useState(true);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Feedback Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetType, setDeleteTargetType] = useState<DeleteTargetType>('single_question');
  const [deleteTargetDetails, setDeleteTargetDetails] = useState<{
    id?: string;
    title?: string;
    statement?: string;
    count?: number;
    volume?: string;
    topic?: string;
  }>({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question>>({
    id: '',
    version: 1,
    volume: 'Direito Tributário',
    topic: '',
    subtopic: '',
    difficulty: 'media',
    type: 'lei_seca',
    status: 'revisada',
    statement: '',
    options: { A: '', B: '', C: '', D: '', E: '' },
    answer: 'A',
    explanation: '',
    legalBasis: '',
    tags: [],
  });
  const [isNew, setIsNew] = useState(false);
  const [changeNote, setChangeNote] = useState('');

  // Version History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<QuestionVersionSnapshot[]>([]);
  const [historyCurrent, setHistoryCurrent] = useState<Question | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await api.adminGetQuestions({
        search: search || undefined,
        status: statusFilter === 'todos' ? undefined : statusFilter,
        volume: volumeFilter === 'todas' ? undefined : volumeFilter,
        origin: originFilter === 'todas' ? undefined : originFilter,
      });
      setQuestions(res.questions);
      if (res.meta) {
        setMetaCounts(res.meta);
      }
      // Remove selected IDs that no longer exist
      setSelectedIds((prev) => prev.filter((id) => res.questions.some((q) => q.id === id)));
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar questões do servidor.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [statusFilter, volumeFilter, originFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === questions.length && questions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Deletion Triggers
  const handleTriggerDeleteSingle = (q: Question) => {
    setDeleteTargetType('single_question');
    setDeleteTargetDetails({
      id: q.id,
      statement: q.statement,
      volume: q.volume,
      topic: q.topic,
    });
    setIsDeleteModalOpen(true);
  };

  const handleTriggerBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteTargetType('bulk_questions');
    setDeleteTargetDetails({
      count: selectedIds.length,
    });
    setIsDeleteModalOpen(true);
  };

  const handleTriggerDeleteAllAdded = () => {
    setDeleteTargetType('all_added_questions');
    setDeleteTargetDetails({
      count: metaCounts.addedCount,
    });
    setIsDeleteModalOpen(true);
  };

  const handleTriggerResetDatabase = () => {
    setDeleteTargetType('reset_database');
    setDeleteTargetDetails({
      count: metaCounts.totalDatabase,
    });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteTargetType === 'single_question' && deleteTargetDetails.id) {
        const res = await api.adminDeleteQuestion(deleteTargetDetails.id);
        showToast(res.message || 'Questão excluída com sucesso!');
      } else if (deleteTargetType === 'bulk_questions') {
        const res = await api.adminBulkDeleteQuestions(selectedIds);
        setSelectedIds([]);
        showToast(res.message || `${selectedIds.length} questões excluídas com sucesso!`);
      } else if (deleteTargetType === 'all_added_questions') {
        const res = await api.adminDeleteAddedQuestions();
        setSelectedIds([]);
        showToast(res.message || 'Questões adicionadas excluídas com sucesso!');
      } else if (deleteTargetType === 'reset_database') {
        const res = await api.adminResetAllQuestions();
        setSelectedIds([]);
        showToast(res.message || 'Banco restaurado para o padrão do sistema!');
      }
      setIsDeleteModalOpen(false);
      await fetchQuestions();
    } catch (err: any) {
      showToast(err.message || 'Erro ao realizar exclusão.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setIsNew(true);
    setChangeNote('Criação de nova questão');
    setEditingQuestion({
      id: `trib-${Date.now().toString().slice(-4)}`,
      version: 1,
      volume: 'Direito Tributário',
      topic: 'Crédito Tributário',
      subtopic: 'Lançamento',
      difficulty: 'media',
      type: 'lei_seca',
      status: 'revisada',
      statement: '',
      options: { A: '', B: '', C: '', D: '', E: '' },
      answer: 'A',
      explanation: '',
      legalBasis: '',
      tags: ['Fiscal', 'Tributário'],
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setIsNew(false);
    setChangeNote('Revisão e atualização de conteúdo');
    setEditingQuestion({ ...q });
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.adminDuplicateQuestion(id);
      fetchQuestions();
      showToast('Questão duplicada com sucesso!');
    } catch (err) {
      showToast('Erro ao duplicar questão.', 'error');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'desativada' ? 'revisada' : 'desativada';
    try {
      await api.adminUpdateStatus(id, nextStatus);
      fetchQuestions();
      showToast(`Status atualizado para "${nextStatus}".`);
    } catch (err) {
      showToast('Erro ao alterar status da questão.', 'error');
    }
  };

  const handleOpenHistory = async (id: string) => {
    try {
      const data = await api.adminGetVersions(id);
      setHistoryVersions(data.versions || []);
      setHistoryCurrent(data.current || null);
      setIsHistoryOpen(true);
    } catch (err) {
      showToast('Erro ao carregar histórico de versões.', 'error');
    }
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion.id || !editingQuestion.statement || !editingQuestion.options || !editingQuestion.answer) {
      showToast('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    try {
      if (isNew) {
        await api.adminCreateQuestion(editingQuestion);
        showToast('Nova questão cadastrada com sucesso!');
      } else {
        await api.adminUpdateQuestion(editingQuestion.id, {
          ...editingQuestion,
          // @ts-ignore
          changeNote,
        });
        showToast('Questão atualizada e versionada com sucesso!');
      }
      setIsEditorOpen(false);
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar questão.', 'error');
    }
  };

  // Run live Quality Audit on currently editing question
  const liveAuditWarnings = auditSingleQuestion(editingQuestion, questions);

  const isAllSelected = questions.length > 0 && selectedIds.length === questions.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < questions.length;

  return (
    <div id="admin-questions-container" className="max-w-6xl mx-auto space-y-6">
      {/* Toast notification banner */}
      {toastMessage && (
        <div
          id="admin-toast-banner"
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-150 ${
            toastMessage.type === 'success'
              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
              : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B91C1C]'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#B91C1C]" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header with Metrics and Global Bank Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <h1 className="font-editorial-heading text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#1C1917]" />
            <span>Banco de Questões — Gestão e Exclusão</span>
          </h1>
          <p className="font-editorial-serif text-xs text-[#78716C] mt-0.5">
            Cadastre, edite com versionamento automático, filtre por origem e exclua questões adicionadas ou em lote com segurança.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {metaCounts.addedCount > 0 && (
            <button
              id="delete-all-added-btn"
              onClick={handleTriggerDeleteAllAdded}
              className="px-3 py-2 bg-white hover:bg-[#FEF2F2] text-[#B91C1C] hover:border-[#FCA5A5] border border-[#EAE6DF] rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Excluir todas as questões importadas ou cadastradas manualmente"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#B91C1C]" />
              <span>Excluir Adicionadas ({metaCounts.addedCount})</span>
            </button>
          )}

          <button
            id="reset-db-btn"
            onClick={handleTriggerResetDatabase}
            className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#57534E] hover:text-[#1A1A1A] border border-[#EAE6DF] rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restaurar questões para o catálogo original pré-instalado"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#78716C]" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            id="create-question-admin-btn"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Questão</span>
          </button>
        </div>
      </div>

      {/* Database Quick Counters & Origin Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setOriginFilter('todas')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            originFilter === 'todas'
              ? 'bg-white border-[#1C1917] ring-1 ring-[#1C1917] shadow-xs'
              : 'bg-[#FAF8F5] border-[#EAE6DF] hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#78716C]">Total no Banco</span>
            <Layers className="w-4 h-4 text-[#78716C]" />
          </div>
          <div className="text-xl font-bold font-editorial-heading text-[#1A1A1A] mt-1">
            {metaCounts.totalDatabase} <span className="text-xs font-mono font-normal text-[#78716C]">questões</span>
          </div>
        </button>

        <button
          onClick={() => setOriginFilter('adicionadas')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            originFilter === 'adicionadas'
              ? 'bg-white border-[#7C3AED] ring-1 ring-[#7C3AED] shadow-xs'
              : 'bg-[#FAF8F5] border-[#EAE6DF] hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#6D28D9] font-bold">Adicionadas / Importadas</span>
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="text-xl font-bold font-editorial-heading text-[#6D28D9] mt-1">
            {metaCounts.addedCount} <span className="text-xs font-mono font-normal text-[#8B5CF6]">customizadas</span>
          </div>
        </button>

        <button
          onClick={() => setOriginFilter('padrao')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            originFilter === 'padrao'
              ? 'bg-white border-[#1C1917] ring-1 ring-[#1C1917] shadow-xs'
              : 'bg-[#FAF8F5] border-[#EAE6DF] hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#78716C]">Catálogo Padrão (Seed)</span>
            <ShieldCheck className="w-4 h-4 text-[#15803D]" />
          </div>
          <div className="text-xl font-bold font-editorial-heading text-[#1A1A1A] mt-1">
            {metaCounts.seedCount} <span className="text-xs font-mono font-normal text-[#78716C]">originais</span>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-2.5" />
            <input
              id="admin-search-input"
              type="text"
              placeholder="Buscar por ID, enunciado, tópico, fundamento legal ou tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-editorial-serif border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg pl-9 pr-3 py-2 text-[#1A1A1A] placeholder-[#A8A29E] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917] focus:bg-white transition-colors"
            />
          </div>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="text-xs font-mono border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
          >
            <option value="todas">Origem: Todas</option>
            <option value="adicionadas">Origem: Adicionadas / JSON</option>
            <option value="padrao">Origem: Catálogo Padrão</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-mono border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
          >
            <option value="todos">Todos os Status</option>
            <option value="revisada">Revisada (Ativa)</option>
            <option value="revisar">Revisar</option>
            <option value="rascunho">Rascunho</option>
            <option value="desativada">Desativada</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Filtrar
          </button>
        </form>

        {/* Selection Toolbar Header */}
        <div className="flex items-center justify-between pt-2 border-t border-[#EAE6DF] text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 text-[#57534E] hover:text-[#1A1A1A] font-mono text-[11px] cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-[#1C1917]" />
              ) : isPartiallySelected ? (
                <CheckSquare className="w-4 h-4 text-[#78716C]" />
              ) : (
                <Square className="w-4 h-4 text-[#A8A29E]" />
              )}
              <span>{isAllSelected ? 'Desmarcar todas' : 'Selecionar todas exibidas'}</span>
            </button>

            {selectedIds.length > 0 && (
              <span className="font-mono text-[11px] bg-[#EDE9FE] text-[#6D28D9] px-2 py-0.5 rounded-full font-bold">
                {selectedIds.length} selecionada(s)
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <button
              id="bulk-delete-btn"
              onClick={handleTriggerBulkDelete}
              className="px-3 py-1 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Selecionadas ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Questions Table / List */}
      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#EAE6DF] text-xs font-mono text-[#78716C]">
          Carregando questões do banco...
        </div>
      ) : questions.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#EAE6DF] text-xs font-editorial-serif text-[#78716C]">
          Nenhuma questão encontrada para a busca ou filtro selecionado.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="divide-y divide-[#EAE6DF]">
            {questions.map((q) => {
              const warnings = q.auditWarnings || [];
              const isDeactivated = q.status === 'desativada';
              const isSelected = selectedIds.includes(q.id);
              const isCustom = q.isCustom;

              return (
                <div
                  key={q.id}
                  id={`admin-question-row-${q.id}`}
                  className={`p-4.5 hover:bg-[#FAF8F5] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDeactivated ? 'opacity-60 bg-[#FAF8F5]/50' : ''
                  } ${isSelected ? 'bg-[#FAF5FF] border-l-4 border-l-[#7C3AED]' : ''}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleSelect(q.id)}
                      className="mt-1 text-[#78716C] hover:text-[#1A1A1A] cursor-pointer"
                      title={isSelected ? 'Desmarcar' : 'Selecionar'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#7C3AED]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#D6CEBE]" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-mono font-bold text-[#1A1A1A] bg-[#FAF8F5] px-2 py-0.5 rounded-sm border border-[#EAE6DF]">
                          {q.id} (v{q.version})
                        </span>

                        {isCustom ? (
                          <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE] flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Adicionada</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold bg-[#F5F2EB] text-[#78716C]">
                            Padrão
                          </span>
                        )}

                        <span className="font-bold text-[#1C1917]">{q.volume}</span>
                        <span className="text-[#A8A29E]">•</span>
                        {q.caderno && (
                          <>
                            <span className="text-[10px] font-mono font-bold bg-[#FFFBEB] text-[#B45309] px-1.5 py-0.5 rounded border border-[#FDE68A]">
                              {q.caderno}
                            </span>
                            <span className="text-[#A8A29E]">•</span>
                          </>
                        )}
                        <span className="text-[#78716C]">{q.topic}</span>
                        <span className="text-[#A8A29E]">•</span>
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase ${
                            q.status === 'revisada'
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : q.status === 'desativada'
                              ? 'bg-[#FEE2E2] text-[#B91C1C]'
                              : 'bg-[#FEF9C3] text-[#854D0E]'
                          }`}
                        >
                          {q.status}
                        </span>
                        <span className="font-mono font-bold text-[#1C1917] bg-white border border-[#EAE6DF] px-1.5 py-0.5 rounded-sm text-[10px]">
                          Gabarito: {q.answer}
                        </span>
                        <QualityAuditBadge warnings={warnings} compact />
                      </div>

                      <p className="font-editorial-serif text-xs text-[#292524] leading-relaxed line-clamp-2">
                        {q.statement}
                      </p>

                      {q.legalBasis && (
                        <div className="text-[11px] font-mono text-[#78716C] truncate">
                          <strong className="text-[#1C1917]">Fundamento:</strong> {q.legalBasis}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <button
                      id={`edit-question-btn-${q.id}`}
                      onClick={() => handleOpenEdit(q)}
                      className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C1917] border border-[#EAE6DF] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Editar questão"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      id={`duplicate-question-btn-${q.id}`}
                      onClick={() => handleDuplicate(q.id)}
                      className="p-1.5 text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] rounded-lg text-xs transition-colors cursor-pointer"
                      title="Duplicar questão"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`history-question-btn-${q.id}`}
                      onClick={() => handleOpenHistory(q.id)}
                      className="p-1.5 text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] rounded-lg text-xs transition-colors cursor-pointer"
                      title="Histórico de versões"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`toggle-status-btn-${q.id}`}
                      onClick={() => handleToggleStatus(q.id, q.status)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isDeactivated ? 'text-[#15803D] hover:bg-[#F0FDF4]' : 'text-[#A8A29E] hover:text-[#B91C1C] hover:bg-[#FEF2F2]'
                      }`}
                      title={isDeactivated ? 'Reativar questão' : 'Desativar questão'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    {/* Dedicated Delete Button */}
                    <button
                      id={`delete-question-btn-${q.id}`}
                      onClick={() => handleTriggerDeleteSingle(q)}
                      className="p-1.5 text-[#A8A29E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg text-xs transition-colors cursor-pointer"
                      title="Excluir questão permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Editor Modal */}
      {isEditorOpen && (
        <div id="question-editor-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#EAE6DF] w-full max-w-3xl my-8 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">
                  {isNew ? 'Cadastrar Nova Questão Fiscal' : `Editar Questão ${editingQuestion.id} (v${editingQuestion.version})`}
                </h3>
                <p className="font-editorial-serif text-xs text-[#78716C]">
                  {isNew ? 'Criará a versão inicial v1 como questão adicionada' : 'Ao salvar, a versão será incrementada e o snapshot anterior guardado no histórico.'}
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#EAE6DF] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEditor} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Quality Audit Alerts Live Panel */}
              <QualityAuditBadge warnings={liveAuditWarnings} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono font-bold text-[#1C1917] mb-1">ID Único</label>
                  <input
                    type="text"
                    disabled={!isNew}
                    value={editingQuestion.id || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, id: e.target.value })}
                    className="w-full border border-[#EAE6DF] rounded-lg p-2 font-mono text-[#1A1A1A] disabled:bg-[#FAF8F5]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-[#1C1917] mb-1">Disciplina / Volume</label>
                  <input
                    type="text"
                    value={editingQuestion.volume || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, volume: e.target.value })}
                    className="w-full border border-[#EAE6DF] rounded-lg p-2 text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                    placeholder="Ex: Direito Tributário"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-[#1C1917] mb-1">Status</label>
                  <select
                    value={editingQuestion.status || 'revisada'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, status: e.target.value as QuestionStatus })}
                    className="w-full border border-[#EAE6DF] rounded-lg p-2 text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                  >
                    <option value="revisada">Revisada (Ativa)</option>
                    <option value="revisar">Revisar</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="desativada">Desativada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-mono font-bold text-[#1C1917] mb-1">Caderno</label>
                  <input
                    type="text"
                    value={editingQuestion.caderno || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, caderno: e.target.value })}
                    className="w-full border border-[#EAE6DF] rounded-lg p-2 text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                    placeholder="Ex: Caderno 1"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-[#1C1917] mb-1">Tópico</label>
                  <input
                    type="text"
                    value={editingQuestion.topic || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                    className="w-full border border-[#EAE6DF] rounded-lg p-2 text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                    placeholder="Ex: Crédito Tributário"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-[#1C1917] mb-1">Subtópico</label>
                  <input
                    type="text"
                    value={editingQuestion.subtopic || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, subtopic: e.target.value })}
                    className="w-full border border-[#EAE6DF] rounded-lg p-2 text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                    placeholder="Ex: Lançamento por Homologação"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold text-[#1C1917] mb-1">Dificuldade</label>
                  <select
                    value={editingQuestion.difficulty || 'media'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as Difficulty })}
                    className="w-full border border-[#EAE6DF] rounded-lg p-2 text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                  >
                    <option value="facil">Fácil</option>
                    <option value="media">Média</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold text-[#1C1917] mb-1">Tipo de Questão</label>
                <select
                  value={editingQuestion.type || 'lei_seca'}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })}
                  className="w-full border border-[#EAE6DF] rounded-lg p-2 text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                >
                  <option value="lei_seca">Lei Seca</option>
                  <option value="conceitual">Doutrina / Conceitual</option>
                  <option value="caso_pratico">Caso Prático</option>
                  <option value="integracao">Integração</option>
                  <option value="prazo_numero">Prazos e Números</option>
                  <option value="assertivas">Assertivas I-II-III</option>
                </select>
              </div>

              {/* Statement */}
              <div>
                <label className="block font-mono font-bold text-[#1C1917] mb-1">Enunciado da Questão</label>
                <textarea
                  rows={4}
                  value={editingQuestion.statement || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, statement: e.target.value })}
                  className="w-full border border-[#EAE6DF] rounded-lg p-3 text-[#1A1A1A] font-editorial-serif leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                  placeholder="Texto do caso ou comando da questão..."
                  required
                />
              </div>

              {/* Options A - E */}
              <div className="space-y-2">
                <label className="block font-mono font-bold text-[#1C1917]">Alternativas A–E</label>
                {(['A', 'B', 'C', 'D', 'E'] as OptionKey[]).map((key) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className="w-7 h-7 rounded-md bg-[#FAF8F5] border border-[#EAE6DF] font-mono font-bold flex items-center justify-center text-[#1C1917] shrink-0 mt-0.5">
                      {key}
                    </span>
                    <input
                      type="text"
                      value={editingQuestion.options?.[key] || ''}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          options: { ...(editingQuestion.options || ({} as any)), [key]: e.target.value },
                        })
                      }
                      className="flex-1 border border-[#EAE6DF] rounded-lg p-2 text-[#1A1A1A] font-editorial-serif focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                      placeholder={`Texto da alternativa ${key}...`}
                      required
                    />
                    <label className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#1C1917] cursor-pointer pt-2 shrink-0">
                      <input
                        type="radio"
                        name="correct-answer-radio"
                        checked={editingQuestion.answer === key}
                        onChange={() => setEditingQuestion({ ...editingQuestion, answer: key })}
                        className="text-[#1C1917] focus:ring-[#1C1917]"
                      />
                      <span>Correta</span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div>
                <label className="block font-mono font-bold text-[#1C1917] mb-1">Comentário Explicativo / Resolução</label>
                <textarea
                  rows={3}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full border border-[#EAE6DF] rounded-lg p-3 text-[#1A1A1A] font-editorial-serif leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                  placeholder="Justificativa técnica da alternativa correta e dos distratores..."
                  required
                />
              </div>

              {/* Legal Basis */}
              <div>
                <label className="block font-mono font-bold text-[#1C1917] mb-1">Fundamento Legal / Norma</label>
                <input
                  type="text"
                  value={editingQuestion.legalBasis || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, legalBasis: e.target.value })}
                  className="w-full border border-[#EAE6DF] rounded-lg p-2 font-mono text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                  placeholder="Ex: Art. 150, VI, 'd' da CF/88; Súmula Vinculante 57 do STF"
                  required
                />
              </div>

              {!isNew && (
                <div>
                  <label className="block font-mono font-bold text-[#1C1917] mb-1">Nota de Alteração (para histórico)</label>
                  <input
                    type="text"
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    className="w-full border border-[#EAE6DF] rounded-lg p-2 text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                    placeholder="Ex: Ajuste no comentário conforme julgado recente do STJ"
                  />
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-[#EAE6DF] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-[#78716C] hover:bg-[#FAF8F5] rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isNew ? 'Salvar Questão' : 'Atualizar e Versionar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {isHistoryOpen && historyCurrent && (
        <div id="version-history-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#EAE6DF] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#EAE6DF] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#1C1917]" />
                <div>
                  <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">
                    Histórico de Versões — {historyCurrent.id}
                  </h3>
                  <p className="font-mono text-[11px] text-[#78716C]">Versão atual: v{historyCurrent.version}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#EAE6DF] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {historyVersions.length === 0 ? (
                <p className="text-xs font-editorial-serif text-[#78716C] text-center py-6">
                  Nenhuma versão prévia arquivada para esta questão.
                </p>
              ) : (
                historyVersions.map((ver, idx) => (
                  <div key={idx} className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#1A1A1A]">
                        Versão {ver.version} ({ver.versionId})
                      </span>
                      <span className="font-mono text-[11px] text-[#78716C]">
                        {new Date(ver.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#57534E]">
                      Alterado por: <strong className="text-[#1C1917]">{ver.changedBy || 'Admin'}</strong>
                    </div>
                    {ver.changeNote && (
                      <div className="text-[11px] text-[#1C1917] bg-white border border-[#EAE6DF] p-2 rounded-md font-editorial-serif">
                        Nota: {ver.changeNote}
                      </div>
                    )}
                    <div className="text-[#57534E] font-editorial-serif italic border-l-2 border-[#1C1917] pl-3 mt-1.5">
                      "{ver.dataSnapshot?.statement?.slice(0, 120)}..."
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletions */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        targetType={deleteTargetType}
        itemDetails={deleteTargetDetails}
        isLoading={isDeleting}
      />
    </div>
  );
};


