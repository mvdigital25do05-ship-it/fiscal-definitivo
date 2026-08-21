import React, { useState, useEffect } from 'react';
import { X, History, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  userId?: string;
}

export const QuestionHistoryModal: React.FC<Props> = ({ isOpen, onClose, questionId, userId }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      api.getQuestionHistory(userId, questionId).then(data => {
        setHistory(data || []);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  }, [isOpen, userId, questionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#EAE6DF] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#EAE6DF] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#1C1917]" />
            <h2 className="font-editorial-heading text-lg font-bold text-[#1A1A1A]">Histórico da Questão</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#EAE6DF] rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-sm font-mono text-[#78716C] py-8">Carregando histórico...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-sm font-mono text-[#78716C] py-8">Nenhuma resolução anterior encontrada.</div>
          ) : (
            <div className="space-y-3">
              {history.map((att, i) => (
                <div key={i} className={`p-3 rounded-lg border \${att.isCorrect ? 'bg-[#ECFDF5] border-[#A7F3D0]' : 'bg-[#FEF2F2] border-[#FECACA]'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {att.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#DC2626]" />
                      )}
                      <span className={`text-sm font-bold \${att.isCorrect ? 'text-[#065F46]' : 'text-[#991B1B]'}`}>
                        {att.isCorrect ? 'Acertou' : 'Errou'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#78716C]">
                      {new Date(att.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-xs text-[#57534E]">
                    Alternativa escolhida: <strong className="uppercase">{att.selectedAnswer}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
