import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  History,
  FileText,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import type { ImportPreviewItem, ImportBatchSummary } from '../types';
import { QualityAuditBadge } from '../components/QualityAuditBadge';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { api } from '../services/api';

const SAMPLE_JSON_TEMPLATE = `[
  {
    "id": "CE-0001",
    "disciplina": "Conhecimentos Específicos",
    "topico": "Atividade prática do fiscal",
    "subtopico": "Formação da prova administrativa",
    "enunciado": "Durante uma fiscalização tributária de rotina em estabelecimento comercial, o auditor fiscal constata indícios de omissão de receitas. Sobre os procedimentos de fiscalização e a formalização do crédito tributário, assinale a afirmativa correta:",
    "alternativas": {
      "A": "O auditor não pode lavrar auto de infração sem prévia intimação de 30 dias.",
      "B": "A apreensão de documentos necessários à comprovação da infração fiscal é admitida mediante lavratura de termo próprio.",
      "C": "A recusa de exibição de livros fiscais pelo contribuinte extingue imediatamente o poder de fiscalizar.",
      "D": "Os termos de fiscalização lavrados não gozam de presunção relativa de veracidade.",
      "E": "A prova colhida em procedimento fiscal não pode ser compartilhada com outros órgãos em nenhuma hipótese."
    },
    "gabarito": "B",
    "comentario": "Nos termos da legislação tributária e do CTN (arts. 195 e 200), a autoridade fiscal poderá apreender documentos e livros fiscais que constituam prova material da infração, lavrando o respectivo termo de apreensão e depósito.",
    "fundamento": "Arts. 142, 195 e 200 do CTN (Lei nº 5.172/1966)."
  }
]`;

interface Props {
  onNavigateToStudy?: () => void;
  onQuestionsImported?: () => void;
}

export const AdminImportView: React.FC<Props> = ({
  onNavigateToStudy,
  onQuestionsImported,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<'todas' | 'novas' | 'atualizacoes' | 'iguais' | 'erros'>('todas');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportBatchSummary | null>(null);
  const [pastBatches, setPastBatches] = useState<ImportBatchSummary[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Delete Batch Modal
  const [batchToDelete, setBatchToDelete] = useState<ImportBatchSummary | null>(null);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  useEffect(() => {
    fetchPastBatches();
  }, []);

  const fetchPastBatches = async () => {
    try {
      const data = await api.adminGetImportBatches();
      setPastBatches(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBatchConfirm = async () => {
    if (!batchToDelete) return;
    setIsDeletingBatch(true);
    try {
      await api.adminDeleteImportBatch(batchToDelete.batchId || batchToDelete.id);
      setBatchToDelete(null);
      await fetchPastBatches();
      if (onQuestionsImported) {
        onQuestionsImported();
      }
    } catch (err: any) {
      alert('Erro ao excluir lote: ' + err.message);
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_JSON_TEMPLATE);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleUseSampleJson = () => {
    setJsonText(SAMPLE_JSON_TEMPLATE);
    analyzeJson(SAMPLE_JSON_TEMPLATE);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      analyzeJson(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const analyzeJson = async (content: string) => {
    try {
      setIsAnalyzing(true);
      setImportSummary(null);
      const parsed = JSON.parse(content);
      const itemsArray = Array.isArray(parsed) ? parsed : [parsed];

      const res = await api.adminPreviewImport(itemsArray);
      setPreviewItems(res.preview);
    } catch (err: any) {
      alert('JSON Inválido. Certifique-se de que o texto está formatado como array JSON válido.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecuteImport = async () => {
    const validQuestions = previewItems
      .filter((p) => p.status !== 'erro' && p.status !== 'igual')
      .map((p) => p.question);

    if (validQuestions.length === 0) {
      alert('Nenhuma questão nova ou atualizada para importar.');
      return;
    }

    setIsImporting(true);
    try {
      const summary = await api.adminExecuteImport({
        questions: validQuestions,
        sourceFilename: 'import_manual.json',
      });
      setImportSummary(summary);
      setPreviewItems([]);
      setJsonText('');
      fetchPastBatches();
      if (onQuestionsImported) {
        onQuestionsImported();
      }
    } catch (err: any) {
      alert('Erro ao executar importação: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredItems = previewItems.filter((item) => {
    if (activeTab === 'novas') return item.status === 'nova';
    if (activeTab === 'atualizacoes') return item.status === 'atualizacao';
    if (activeTab === 'iguais') return item.status === 'igual';
    if (activeTab === 'erros') return item.status === 'erro';
    return true;
  });

  const countNovas = previewItems.filter((i) => i.status === 'nova').length;
  const countAtualizacoes = previewItems.filter((i) => i.status === 'atualizacao').length;
  const countIguais = previewItems.filter((i) => i.status === 'igual').length;
  const countErros = previewItems.filter((i) => i.status === 'erro').length;

  return (
    <div id="admin-import-view-container" className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
        <div>
          <h1 className="font-editorial-heading text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-[#1C1917]" />
            <span>Importador de Questões JSON</span>
          </h1>
          <p className="font-editorial-serif text-xs text-[#78716C] mt-0.5">
            Adicione novas questões em lote com validação de gabarito e auditoria estrutural em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-sample-template-btn"
            onClick={handleCopyTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF8F5] text-[#1C1917] border border-[#EAE6DF] rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer"
          >
            {copiedTemplate ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTemplate ? 'Modelo Copiado!' : 'Copiar Modelo JSON'}</span>
          </button>

          <button
            id="use-sample-json-btn"
            onClick={handleUseSampleJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C1917] border border-[#EAE6DF] rounded-xl text-xs font-mono font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#854D0E]" />
            <span>Carregar Exemplo</span>
          </button>
        </div>
      </div>

      {/* Upload Box & Raw Paste */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dropzone */}
        <div
          id="json-dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-all bg-white min-h-[220px] ${
            isDragging ? 'border-[#1C1917] bg-[#FAF8F5]' : 'border-[#EAE6DF] hover:border-[#A8A29E]'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-[#1C1917] flex items-center justify-center mb-3">
            <FileJson className="w-6 h-6" />
          </div>
          <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Arraste seu arquivo .json aqui</h3>
          <p className="font-editorial-serif text-xs text-[#78716C] mt-1">ou selecione do seu computador</p>

          <label className="mt-4 px-4 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-colors">
            <span>Selecionar Arquivo</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
          </label>
        </div>

        {/* Raw JSON paste */}
        <div className="bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-3">
          <div>
            <label className="block text-xs font-mono font-bold text-[#1C1917] mb-1">
              Cole o JSON no Formato Oficial:
            </label>
            <textarea
              rows={6}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[ { "id": "CE-0001", "disciplina": "Conhecimentos Específicos", "topico": "Atividade prática do fiscal", "subtopico": "Formação da prova administrativa", "enunciado": "...", "alternativas": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." }, "gabarito": "B", "comentario": "...", "fundamento": "..." } ]'
              className="w-full text-xs font-mono p-2.5 border border-[#EAE6DF] bg-[#FAF8F5] rounded-xl text-[#1A1A1A] placeholder-[#A8A29E] focus:outline-hidden focus:ring-1 focus:ring-[#1C1917] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => analyzeJson(jsonText)}
              disabled={!jsonText || isAnalyzing}
              className="px-5 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {isAnalyzing ? 'Validando Lote...' : 'Validar & Analisar Lote'}
            </button>
          </div>
        </div>
      </div>

      {/* Official Format Reference Card */}
      <div className="p-4 bg-[#FAF8F5] border border-[#EAE6DF] rounded-2xl text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-[#1C1917] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#854D0E]" />
            <span>Especificação do Formato Oficial de Importação</span>
          </span>
          <span className="text-[11px] font-mono text-[#78716C] bg-white px-2 py-0.5 rounded-sm border border-[#EAE6DF]">
            JSON Array
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
          <div className="p-2 bg-white rounded-lg border border-[#EAE6DF]">
            <strong className="text-[#1C1917]">id</strong>: <span className="text-[#78716C]">Código único</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#EAE6DF]">
            <strong className="text-[#1C1917]">disciplina</strong>: <span className="text-[#78716C]">Matéria</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#EAE6DF]">
            <strong className="text-[#1C1917]">caderno</strong>: <span className="text-[#78716C]">Bloco / Módulo</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#EAE6DF]">
            <strong className="text-[#1C1917]">topico</strong>: <span className="text-[#78716C]">Assunto</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#EAE6DF]">
            <strong className="text-[#1C1917]">subtopico</strong>: <span className="text-[#78716C]">Específico (opt)</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#EAE6DF]">
            <strong className="text-[#1C1917]">enunciado</strong>: <span className="text-[#78716C]">Texto da questão</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#EAE6DF]">
            <strong className="text-[#1C1917]">alternativas</strong>: <span className="text-[#78716C]">{"{ A, B, C, D, E }"}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#EAE6DF]">
            <strong className="text-[#1C1917]">gabarito</strong>: <span className="text-[#78716C]">Letra ("A" a "E")</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#EAE6DF]">
            <strong className="text-[#1C1917]">comentario</strong>: <span className="text-[#78716C]">Resolução / Fund.</span>
          </div>
        </div>
      </div>

      {/* Success Summary Banner if just completed */}
      {importSummary && (
        <div
          id="import-summary-alert"
          className="p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-[#14532D] space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
              <span>Importação Concluída com Sucesso!</span>
            </div>

            {onNavigateToStudy && (
              <button
                id="after-import-go-study-btn"
                onClick={onNavigateToStudy}
                className="px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <span>Ir para Sessão de Estudo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs text-[#166534] font-mono flex flex-wrap gap-4 pt-1 border-t border-[#BBF7D0]">
            <span>Lote: <strong>{importSummary.batchId}</strong></span>
            <span>Total processadas: <strong>{importSummary.totalProcessed}</strong></span>
            <span>Novas cadastradas: <strong>{importSummary.createdCount}</strong></span>
            <span>Atualizadas: <strong>{importSummary.updatedCount}</strong></span>
            <span>Ignoradas (sem alteração): <strong>{importSummary.skippedCount}</strong></span>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] pb-4">
            <div>
              <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">
                Pré-visualização e Auditoria do Lote ({previewItems.length} itens)
              </h3>
              <p className="font-editorial-serif text-xs text-[#78716C]">
                Revise os status e avisos de qualidade antes de confirmar a gravação definitiva.
              </p>
            </div>

            <button
              id="confirm-execute-import-btn"
              onClick={handleExecuteImport}
              disabled={isImporting || countNovas + countAtualizacoes === 0}
              className="px-6 py-2.5 bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{isImporting ? 'Importando Lote...' : `Executar Importação (${countNovas + countAtualizacoes} válidas)`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Categorized Tabs */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 border border-[#EAE6DF] rounded-xl text-xs font-mono font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('todas')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'todas' ? 'bg-white text-[#1C1917] shadow-2xs font-bold border border-[#EAE6DF]' : 'text-[#78716C]'
              }`}
            >
              Todas ({previewItems.length})
            </button>
            <button
              onClick={() => setActiveTab('novas')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'novas' ? 'bg-[#F0FDF4] text-[#15803D] shadow-2xs font-bold border border-[#BBF7D0]' : 'text-[#78716C]'
              }`}
            >
              Novas ({countNovas})
            </button>
            <button
              onClick={() => setActiveTab('atualizacoes')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'atualizacoes' ? 'bg-white text-[#1C1917] shadow-2xs font-bold border border-[#1C1917]' : 'text-[#78716C]'
              }`}
            >
              Atualizações ({countAtualizacoes})
            </button>
            <button
              onClick={() => setActiveTab('iguais')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'iguais' ? 'bg-white text-[#57534E] shadow-2xs font-bold border border-[#EAE6DF]' : 'text-[#78716C]'
              }`}
            >
              Iguais / Ignorar ({countIguais})
            </button>
            <button
              onClick={() => setActiveTab('erros')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'erros' ? 'bg-[#FEF2F2] text-[#B91C1C] shadow-2xs font-bold border border-[#FECACA]' : 'text-[#78716C]'
              }`}
            >
              Erros ({countErros})
            </button>
          </div>

          {/* Preview Items List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  item.status === 'nova'
                    ? 'bg-[#F0FDF4]/50 border-[#BBF7D0]'
                    : item.status === 'atualizacao'
                    ? 'bg-[#FAF8F5] border-[#EAE6DF]'
                    : item.status === 'erro'
                    ? 'bg-[#FEF2F2]/60 border-[#FECACA]'
                    : 'bg-[#FAF8F5] border-[#EAE6DF]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-sm border border-[#EAE6DF] text-[#1A1A1A]">
                      {item.question?.id || `Item #${idx + 1}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase ${
                        item.status === 'nova'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : item.status === 'atualizacao'
                          ? 'bg-[#FAF8F5] text-[#1C1917] border border-[#EAE6DF]'
                          : item.status === 'erro'
                          ? 'bg-[#FEE2E2] text-[#B91C1C]'
                          : 'bg-[#EAE6DF] text-[#57534E]'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.question?.volume && <span className="font-bold text-[#1C1917]">{item.question.volume}</span>}
                    {item.question?.caderno && (
                      <span className="text-[10px] font-mono font-bold bg-[#FFFBEB] text-[#B45309] px-2 py-0.5 rounded border border-[#FDE68A]">
                        {item.question.caderno}
                      </span>
                    )}
                    {item.question?.topic && <span className="text-[#78716C] font-editorial-serif">• {item.question.topic}</span>}
                    {item.question?.subtopic && <span className="text-[#A8A29E] font-editorial-serif">/ {item.question.subtopic}</span>}
                    {item.question?.answer && (
                      <span className="bg-[#1C1917] text-[#FAF8F5] px-1.5 py-0.5 rounded-sm font-mono font-bold text-[10px]">
                        Gabarito: {item.question.answer}
                      </span>
                    )}
                  </div>

                  {item.auditWarnings && item.auditWarnings.length > 0 && (
                    <QualityAuditBadge warnings={item.auditWarnings} compact />
                  )}
                </div>

                <p className="font-editorial-serif text-xs text-[#292524] leading-relaxed">
                  {item.question?.statement || 'Sem enunciado'}
                </p>

                {item.question?.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] font-editorial-serif text-[#57534E]">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((k) => (
                      item.question.options[k] ? (
                        <div
                          key={k}
                          className={`p-1.5 rounded-md border ${
                            item.question.answer === k
                              ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D] font-medium'
                              : 'bg-white border-[#EAE6DF]'
                          }`}
                        >
                          <strong className="font-mono">{k})</strong> {item.question.options[k]}
                        </div>
                      ) : null
                    ))}
                  </div>
                )}

                {(item.question?.explanation || item.question?.legalBasis) && (
                  <div className="text-[11px] font-editorial-serif text-[#78716C] bg-white p-2 rounded-lg border border-[#EAE6DF] space-y-0.5">
                    {item.question?.explanation && (
                      <div><strong>Comentário:</strong> {item.question.explanation}</div>
                    )}
                    {item.question?.legalBasis && (
                      <div className="text-[#854D0E]"><strong>Fundamento:</strong> {item.question.legalBasis}</div>
                    )}
                  </div>
                )}

                {item.errors && item.errors.length > 0 && (
                  <div className="p-2 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] rounded-md text-[11px] font-mono">
                    <strong>Erros estruturais:</strong> {item.errors.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Import Batches History */}
      {pastBatches.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EAE6DF] shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#78716C]" />
            <h3 className="font-editorial-heading text-base font-bold text-[#1A1A1A]">Histórico de Lotes Importados</h3>
          </div>

          <div className="divide-y divide-[#EAE6DF] text-xs">
            {pastBatches.map((b) => {
              const batchId = b.batchId || b.id;
              return (
                <div key={batchId} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-mono font-bold text-[#1C1917]">{batchId}</div>
                    <div className="text-[11px] font-mono text-[#78716C]">
                      Importado em {new Date(b.timestamp).toLocaleString('pt-BR')} por {b.importedBy || 'Admin'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 font-mono text-[#57534E]">
                      <span>Total: <strong className="text-[#1C1917]">{b.totalQuestions || b.totalProcessed || 0}</strong></span>
                      <span className="text-[#15803D]">Novas: <strong>{b.insertedCount || b.createdCount || 0}</strong></span>
                      <span className="text-[#1C1917]">Atualizadas: <strong>{b.updatedCount || 0}</strong></span>
                    </div>

                    <button
                      id={`delete-batch-btn-${batchId}`}
                      onClick={() => setBatchToDelete(b)}
                      className="p-1.5 text-[#A8A29E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg text-xs transition-colors cursor-pointer"
                      title="Excluir este lote e suas questões"
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

      {/* Delete Batch Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!batchToDelete}
        onClose={() => setBatchToDelete(null)}
        onConfirm={handleDeleteBatchConfirm}
        targetType="import_batch"
        itemDetails={{
          id: batchToDelete?.batchId || batchToDelete?.id,
          batchName: batchToDelete?.datasetName || batchToDelete?.batchId,
          count: batchToDelete?.totalQuestions || batchToDelete?.totalProcessed,
        }}
        isLoading={isDeletingBatch}
      />
    </div>
  );
};
