import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export type DeleteTargetType =
  | 'single'
  | 'single_question'
  | 'bulk'
  | 'bulk_questions'
  | 'all_added_questions'
  | 'reset_database'
  | 'discipline'
  | 'discipline_questions'
  | 'import_batch'
  | 'batch';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  targetType: DeleteTargetType;
  itemDetails?: {
    id?: string;
    title?: string;
    statement?: string;
    count?: number;
    volume?: string;
    disciplineName?: string;
    topic?: string;
    batchName?: string;
  };
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetType,
  itemDetails,
  isLoading = false,
}) => {
  const [confirmedCheck, setConfirmedCheck] = useState(false);

  if (!isOpen) return null;

  const getModalConfig = () => {
    const volumeName = itemDetails?.disciplineName || itemDetails?.volume;
    const batchIdentifier = itemDetails?.batchName || itemDetails?.id;

    switch (targetType) {
      case 'single':
      case 'single_question':
        return {
          title: 'Excluir Questão',
          badge: 'Ação Permanente',
          badgeColor: 'bg-[#FEE2E2] text-[#B91C1C]',
          icon: Trash2,
          iconColor: 'text-[#B91C1C]',
          description: (
            <div className="space-y-2">
              <p className="text-xs text-[#57534E]">
                Você está prestes a excluir permanentemente a questão abaixo do banco de dados:
              </p>
              <div className="p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl space-y-1 text-xs">
                <div className="flex items-center gap-2 font-mono font-bold text-[#1C1917]">
                  {itemDetails?.id && (
                    <span className="bg-white px-1.5 py-0.5 border border-[#EAE6DF] rounded-sm">
                      {itemDetails.id}
                    </span>
                  )}
                  {volumeName && <span className="text-[#78716C]">• {volumeName}</span>}
                </div>
                {itemDetails?.statement && (
                  <p className="font-editorial-serif text-[#292524] line-clamp-3 italic">
                    "{itemDetails.statement}"
                  </p>
                )}
              </div>
            </div>
          ),
          confirmBtnText: 'Excluir Questão',
          needsCheckbox: false,
        };

      case 'bulk':
      case 'bulk_questions':
        return {
          title: `Excluir ${itemDetails?.count || 0} Questões Selecionadas`,
          badge: 'Exclusão em Lote',
          badgeColor: 'bg-[#FEE2E2] text-[#B91C1C]',
          icon: Trash2,
          iconColor: 'text-[#B91C1C]',
          description: (
            <div className="space-y-2 text-xs text-[#57534E]">
              <p>
                Você selecionou <strong>{itemDetails?.count || 0} questões</strong> para exclusão definitiva.
              </p>
              <p className="p-2.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-xl text-[11px] leading-relaxed">
                Esta ação removerá todas as questões selecionadas do banco de dados e de quaisquer sessões de estudo ativas.
              </p>
            </div>
          ),
          confirmBtnText: `Excluir ${itemDetails?.count || 0} Questões`,
          needsCheckbox: false,
        };

      case 'all_added_questions':
        return {
          title: 'Excluir Todas as Questões Adicionadas',
          badge: 'Limpeza de Importações',
          badgeColor: 'bg-[#FEF9C3] text-[#854D0E]',
          icon: AlertTriangle,
          iconColor: 'text-[#D97706]',
          description: (
            <div className="space-y-2.5 text-xs text-[#57534E]">
              <p>
                Esta ação excluirá <strong>todas as questões adicionadas ou importadas</strong> por arquivos JSON ou cadastro manual.
              </p>
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-xl text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#15803D] mt-0.5" />
                <span>
                  <strong>As questões padrão do sistema (seed original) serão preservadas intactas.</strong>
                </span>
              </div>
            </div>
          ),
          confirmBtnText: 'Excluir Apenas Questões Adicionadas',
          needsCheckbox: true,
          checkboxLabel: 'Entendo que todas as questões customizadas/importadas serão excluídas',
        };

      case 'reset_database':
        return {
          title: 'Restaurar Banco para Padrão de Fábrica',
          badge: 'Reset Geral',
          badgeColor: 'bg-[#FEE2E2] text-[#B91C1C]',
          icon: ShieldAlert,
          iconColor: 'text-[#B91C1C]',
          description: (
            <div className="space-y-2.5 text-xs text-[#57534E]">
              <p>
                Esta ação irá <strong>limpar todo o histórico de importações e customizações</strong>, restaurando o banco de dados exatamente para o estado inicial com as questões oficiais pré-cadastradas.
              </p>
              <p className="p-2.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-xl text-[11px]">
                Sessões de treino em andamento serão redefinidas para o catálogo padrão.
              </p>
            </div>
          ),
          confirmBtnText: 'Restaurar Banco Padrão',
          needsCheckbox: true,
          checkboxLabel: 'Confirmo a restauração geral do banco de questões',
        };

      case 'discipline':
      case 'discipline_questions':
        return {
          title: `Excluir Questões de ${volumeName || 'Disciplina'}`,
          badge: 'Exclusão Temática',
          badgeColor: 'bg-[#FEE2E2] text-[#B91C1C]',
          icon: Trash2,
          iconColor: 'text-[#B91C1C]',
          description: (
            <div className="space-y-2 text-xs text-[#57534E]">
              <p>
                Deseja excluir todas as questões da disciplina{' '}
                <strong>{volumeName}</strong>
                {itemDetails?.topic ? ` (Tópico: "${itemDetails.topic}")` : ''}?
              </p>
              <p className="p-2.5 bg-[#FAF8F5] border border-[#EAE6DF] text-[#78716C] rounded-xl text-[11px]">
                Total de questões afetadas: <strong>{itemDetails?.count || 'Todas'}</strong>.
              </p>
            </div>
          ),
          confirmBtnText: 'Excluir Questões da Disciplina',
          needsCheckbox: false,
        };

      case 'batch':
      case 'import_batch':
        return {
          title: 'Excluir Lote de Importação',
          badge: 'Excluir Lote',
          badgeColor: 'bg-[#FEE2E2] text-[#B91C1C]',
          icon: Trash2,
          iconColor: 'text-[#B91C1C]',
          description: (
            <div className="space-y-2 text-xs text-[#57534E]">
              <p>
                Deseja excluir o lote <strong>"{batchIdentifier}"</strong>?
              </p>
              <p className="p-2.5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] rounded-xl text-[11px]">
                Todas as questões inseridas por este arquivo JSON serão removidas do banco de dados.
              </p>
            </div>
          ),
          confirmBtnText: 'Excluir Lote e Questões',
          needsCheckbox: false,
        };

      default:
        return {
          title: 'Confirmar Exclusão',
          badge: 'Exclusão',
          badgeColor: 'bg-[#FEE2E2] text-[#B91C1C]',
          icon: Trash2,
          iconColor: 'text-[#B91C1C]',
          description: (
            <div className="space-y-2 text-xs text-[#57534E]">
              <p>Tem certeza de que deseja confirmar a exclusão deste item?</p>
            </div>
          ),
          confirmBtnText: 'Confirmar Exclusão',
          needsCheckbox: false,
        };
    }
  };

  const config = getModalConfig() || {
    title: 'Confirmar Exclusão',
    badge: 'Exclusão',
    badgeColor: 'bg-[#FEE2E2] text-[#B91C1C]',
    icon: Trash2,
    iconColor: 'text-[#B91C1C]',
    description: <p className="text-xs text-[#57534E]">Confirmar exclusão?</p>,
    confirmBtnText: 'Excluir',
    needsCheckbox: false,
  };
  const Icon = config.icon || Trash2;
  const isConfirmDisabled = isLoading || (config.needsCheckbox && !confirmedCheck);

  return (
    <div
      id="delete-confirm-modal-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="delete-confirm-modal-box"
        className="bg-white rounded-2xl border border-[#EAE6DF] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EAE6DF] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF] ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1A1A1A] font-editorial-heading">
                  {config.title}
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${config.badgeColor}`}>
                  {config.badge}
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] font-mono mt-0.5">Confirmação de segurança</p>
            </div>
          </div>

          <button
            id="close-delete-modal-btn"
            onClick={onClose}
            disabled={isLoading}
            className="text-[#A8A29E] hover:text-[#1A1A1A] p-1 rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {config.description}

          {config.needsCheckbox && (
            <label className="flex items-start gap-2.5 p-3 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl cursor-pointer hover:bg-[#F5F2EB] transition-colors">
              <input
                id="delete-modal-checkbox"
                type="checkbox"
                checked={confirmedCheck}
                onChange={(e) => setConfirmedCheck(e.target.checked)}
                className="mt-0.5 rounded-sm border-[#D6CEBE] text-[#B91C1C] focus:ring-[#B91C1C]"
              />
              <span className="text-xs text-[#292524] font-medium leading-tight select-none">
                {config.checkboxLabel || 'Estou ciente e desejo prosseguir com a exclusão'}
              </span>
            </label>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#EAE6DF] flex items-center justify-end gap-2.5">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#1A1A1A] hover:bg-[#EAE6DF] rounded-xl border border-[#EAE6DF] bg-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            id="confirm-delete-action-btn"
            type="button"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isConfirmDisabled
                ? 'bg-[#EAE6DF] text-[#A8A29E] cursor-not-allowed'
                : 'bg-[#B91C1C] hover:bg-[#991B1B] active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{config.confirmBtnText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
