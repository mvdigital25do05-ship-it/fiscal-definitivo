import React, { useState, useEffect } from 'react';
import {
  MessageSquareWarning,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Check,
  X,
  Search,
} from 'lucide-react';
import type { QuestionReport } from '../types';
import { api } from '../services/api';

export const AdminReportsView: React.FC = () => {
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.adminGetReports(statusFilter === 'todos' ? undefined : statusFilter);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleUpdateStatus = async (reportId: string, status: 'resolvido' | 'descartado') => {
    const note = resolutionNotes[reportId] || (status === 'resolvido' ? 'Problema verificado e corrigido.' : 'Relatório analisado e descartado.');
    try {
      await api.adminResolveReport(reportId, status, note);
      fetchReports();
    } catch (err) {
      alert('Erro ao atualizar status do relatório.');
    }
  };

  const reasonLabels: Record<string, string> = {
    gabarito_incorreto: 'Gabarito Incorreto',
    enunciado_ambiguo: 'Enunciado Ambíguo / Confuso',
    desatualizada: 'Legislação / Doutrina Desatualizada',
    erro_digitacao: 'Erro de Digitação / Formatação',
    outro: 'Outro Problema',
  };

  return (
    <div id="admin-reports-container" className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <h1 className="font-editorial-heading text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-[#B91C1C]" />
            <span>Relatórios de Problemas em Questões</span>
          </h1>
          <p className="font-editorial-serif text-xs text-[#78716C] mt-0.5">
            Gerencie apontamentos de erros de gabarito, desatualizações legais e ambiguidades enviados pelos concurseiros.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-[#EAE6DF] bg-white rounded-lg px-3 py-2 text-[#1A1A1A] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
        >
          <option value="todos">Todos os Status</option>
          <option value="pendente">Apenas Pendentes</option>
          <option value="resolvido">Apenas Resolvidos</option>
          <option value="descartado">Apenas Descartados</option>
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-xl border border-[#EAE6DF] text-xs font-mono text-[#78716C]">
          Carregando relatórios...
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-2">
          <CheckCircle2 className="w-8 h-8 text-[#15803D] mx-auto" />
          <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Nenhum relatório pendente!</h3>
          <p className="font-editorial-serif text-xs text-[#78716C]">O banco de questões está sem pendências registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className={`bg-white p-5 rounded-xl border shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3 ${
                rep.status === 'pendente' ? 'border-[#FEF08A] bg-[#FEFCE8]/30' : 'border-[#EAE6DF]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-[#1A1A1A] bg-[#FAF8F5] px-2 py-0.5 rounded-sm border border-[#EAE6DF]">
                    {rep.questionId} (v{rep.questionVersion})
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-2 py-0.5 rounded-md">
                    {reasonLabels[rep.reason] || rep.reason}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm ${
                      rep.status === 'pendente'
                        ? 'bg-[#FEF9C3] text-[#854D0E]'
                        : rep.status === 'resolvido'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#FAF8F5] text-[#57534E] border border-[#EAE6DF]'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-[#A8A29E]">
                  {new Date(rep.createdAt).toLocaleString('pt-BR')} por {rep.userEmail || rep.userId}
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg text-xs text-[#292524] leading-relaxed font-editorial-serif">
                <strong className="font-sans font-bold text-[#1C1917] block mb-1">Descrição do Usuário:</strong> {rep.details}
              </div>

              {rep.status === 'pendente' ? (
                <div className="pt-2 border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Nota de resolução / justificativa (opcional)..."
                    value={resolutionNotes[rep.id] || ''}
                    onChange={(e) => setResolutionNotes({ ...resolutionNotes, [rep.id]: e.target.value })}
                    className="text-xs border border-[#EAE6DF] bg-white rounded-lg px-3 py-1.5 flex-1 min-w-[200px] text-[#1A1A1A] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(rep.id, 'descartado')}
                      className="px-3 py-1.5 text-[#78716C] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(rep.id, 'resolvido')}
                      className="px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Marcar como Resolvido</span>
                    </button>
                  </div>
                </div>
              ) : (
                rep.adminNote && (
                  <div className="text-[11px] font-mono text-[#57534E] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EAE6DF]">
                    <strong className="text-[#1C1917]">Resolução Admin:</strong> {rep.adminNote}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

