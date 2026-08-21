import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
  answered: number;
  blank: number;
  mode: 'study' | 'simulado';
  isSubmitting?: boolean;
}

export const SessionFinishModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  total,
  answered,
  blank,
  mode,
  isSubmitting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div id="finish-session-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-xs p-4">
      <div id="finish-session-modal-card" className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#EAE6DF] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-[#EAE6DF] flex items-start justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            {blank > 0 ? (
              <div className="p-2 bg-[#FEF9C3] text-[#854D0E] rounded-xl border border-[#FEF08A]">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-[#DCFCE7] text-[#15803D] rounded-xl border border-[#BBF7D0]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-editorial-heading text-lg font-bold text-[#1A1A1A]">
                {mode === 'simulado' ? 'Finalizar Simulado' : 'Finalizar Sessão'}
              </h3>
              <p className="font-editorial-serif text-xs text-[#78716C]">Confirme a conclusão para gerar o relatório detalhado.</p>
            </div>
          </div>
          <button
            id="close-finish-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#EAE6DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF]">
              <div className="text-[11px] font-mono text-[#78716C] font-medium">Total</div>
              <div className="text-xl font-bold font-mono text-[#1A1A1A] mt-0.5">{total}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#1C1917]">
              <div className="text-[11px] font-mono text-[#1C1917] font-medium">Marcadas</div>
              <div className="text-xl font-bold font-mono text-[#1C1917] mt-0.5">{answered}</div>
            </div>
            <div className={`p-3 rounded-xl border ${blank > 0 ? 'bg-[#FEFCE8] border-[#FEF08A]' : 'bg-[#FAF8F5] border-[#EAE6DF]'}`}>
              <div className={`text-[11px] font-mono font-medium ${blank > 0 ? 'text-[#854D0E] font-bold' : 'text-[#78716C]'}`}>
                Em Branco
              </div>
              <div className={`text-xl font-bold font-mono mt-0.5 ${blank > 0 ? 'text-[#854D0E]' : 'text-[#57534E]'}`}>{blank}</div>
            </div>
          </div>

          {blank > 0 && (
            <div className="p-3.5 bg-[#FEFCE8] border border-[#FEF08A] rounded-xl text-xs text-[#713F12] leading-relaxed font-editorial-serif">
              <strong className="font-sans font-bold text-[#854D0E]">Atenção:</strong> Você ainda possui <strong>{blank} questão(ões) em branco</strong>. Ao finalizar, as questões sem resposta serão contabilizadas como incorretas/não respondidas.
            </div>
          )}

          <p className="text-xs font-editorial-serif text-[#57534E] leading-relaxed">
            {mode === 'simulado'
              ? 'Após confirmar, o gabarito oficial com fundamentação jurídica completa será liberado para revisão minuciosa.'
              : 'O resumo de desempenho da sessão será salvo no seu histórico e sincronizado com as métricas de evolução.'}
          </p>
        </div>

        <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE6DF] flex items-center justify-end gap-2.5">
          <button
            type="button"
            id="cancel-finish-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#78716C] hover:bg-[#EAE6DF] rounded-lg transition-colors cursor-pointer"
          >
            Continuar Resolvendo
          </button>
          <button
            type="button"
            id="confirm-finish-btn"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-[#FAF8F5] bg-[#1C1917] hover:bg-[#292524] disabled:opacity-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Processando...' : 'Confirmar e Finalizar'}
          </button>
        </div>
      </div>
    </div>
  );
};

