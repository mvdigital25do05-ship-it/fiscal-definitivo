import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import type { ReportReason } from '../types';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  questionVersion: number;
  userId: string;
  userEmail?: string;
}

const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'gabarito_duvidoso', label: 'Gabarito duvidoso ou incorreto' },
  { value: 'resposta_denunciada_tamanho', label: 'Resposta denunciada pelo tamanho excessivo' },
  { value: 'distratores_fracos', label: 'Distratores fracos ou irreais' },
  { value: 'enunciado_confuso', label: 'Enunciado confuso ou mal redigido' },
  { value: 'questao_repetida', label: 'Questão repetida ou duplicada' },
  { value: 'comentario_insuficiente', label: 'Comentário explicativo insuficiente' },
  { value: 'norma_incorreta', label: 'Norma ou fundamento legal possivelmente incorreto' },
  { value: 'muito_facil', label: 'Questão com nível excessivamente fácil' },
  { value: 'outro', label: 'Outro motivo' },
];

export const ReportIssueModal: React.FC<Props> = ({
  isOpen,
  onClose,
  questionId,
  questionVersion,
  userId,
  userEmail,
}) => {
  const [reason, setReason] = useState<ReportReason>('gabarito_duvidoso');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.reportQuestion({
        questionId,
        questionVersion,
        userId,
        userEmail,
        reason,
        details,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDetails('');
        onClose();
      }, 1400);
    } catch (err) {
      alert('Erro ao enviar o relato. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="report-issue-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-xs p-4">
      <div id="report-issue-modal-card" className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#EAE6DF] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE6DF] bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#B91C1C]" />
            <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Reportar Problema na Questão</h3>
          </div>
          <button
            id="close-report-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#EAE6DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div id="report-success-state" className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#15803D] mx-auto animate-bounce" />
            <h4 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Relato Enviado com Sucesso</h4>
            <p className="font-editorial-serif text-xs text-[#78716C]">Nossa equipe de auditoria fiscal analisará esta questão.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="text-xs font-mono text-[#57534E]">
              Questão ID: <span className="font-bold text-[#1A1A1A]">{questionId}</span> (v{questionVersion})
            </div>

            <div>
              <label htmlFor="report-reason-select" className="block text-xs font-bold text-[#1C1917] mb-1.5 font-mono">
                Motivo Principal
              </label>
              <select
                id="report-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full text-xs font-mono border border-[#EAE6DF] rounded-lg px-3 py-2 text-[#1A1A1A] bg-[#FAF8F5] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917] focus:bg-white"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-details-textarea" className="block text-xs font-bold text-[#1C1917] mb-1.5 font-mono">
                Detalhes ou Fundamento Proposto (opcional)
              </label>
              <textarea
                id="report-details-textarea"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explique o ponto de divergência, cite a legislação ou artigo se aplicável..."
                className="w-full text-xs font-editorial-serif border border-[#EAE6DF] bg-[#FAF8F5] rounded-lg p-3 text-[#1A1A1A] placeholder:text-[#A8A29E] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917] focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE6DF]">
              <button
                type="button"
                id="cancel-report-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#78716C] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="submit-report-btn"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] disabled:opacity-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Enviando...' : 'Enviar Relato'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

