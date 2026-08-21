import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import type { QualityAuditWarning } from '../types';

interface Props {
  warnings: QualityAuditWarning[];
  compact?: boolean;
}

export const QualityAuditBadge: React.FC<Props> = ({ warnings, compact = false }) => {
  if (!warnings || warnings.length === 0) {
    return compact ? null : (
      <div id="quality-audit-pass" className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F0FDF4] text-[#15803D] text-xs font-mono font-medium rounded-lg border border-[#BBF7D0]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Auditoria OK: Sem alertas</span>
      </div>
    );
  }

  if (compact) {
    const hasWarning = warnings.some((w) => w.severity === 'warning');
    return (
      <span
        id="quality-audit-compact-badge"
        title={warnings.map((w) => w.message).join('\n')}
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium rounded-md ${
          hasWarning ? 'bg-[#FEF9C3] text-[#854D0E] border border-[#FEF08A]' : 'bg-[#FAF8F5] text-[#1C1917] border border-[#EAE6DF]'
        }`}
      >
        <AlertTriangle className="w-3 h-3" />
        {warnings.length} {warnings.length === 1 ? 'alerta' : 'alertas'}
      </span>
    );
  }

  return (
    <div id="quality-audit-container" className="space-y-2 my-2">
      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1C1917] uppercase tracking-wider">
        <AlertTriangle className="w-4 h-4 text-[#854D0E]" />
        <span>Alertas de Auditoria de Qualidade ({warnings.length})</span>
      </div>
      <div className="space-y-1.5">
        {warnings.map((w, idx) => (
          <div
            key={idx}
            id={`quality-warning-${idx}`}
            className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
              w.severity === 'warning'
                ? 'bg-[#FEFCE8] border-[#FEF08A] text-[#713F12]'
                : 'bg-[#FAF8F5] border-[#EAE6DF] text-[#1C1917]'
            }`}
          >
            {w.severity === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-[#854D0E] shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-[#1C1917] shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{w.message}</div>
              {w.details && <div className="text-[#78716C] font-editorial-serif mt-0.5 text-xs">{w.details}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

