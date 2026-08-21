import type {
  StudySession,
  SessionFilters,
  OptionKey,
  UserProfile,
  GlobalUserStats,
  UserFavorite,
  ErrorNotebookSummary,
  ErrorNotebookItem,
  SanitizedQuestion,
  Question,
  QuestionReport,
  ReportReason,
  ImportBatchSummary,
  ImportPreviewItem,
  DisciplinesMetaResponse,
} from '../types';

export const api = {
  // Sync profile
  syncUser: async (user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    role?: 'admin' | 'user';
  }): Promise<UserProfile> => {
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Falha ao sincronizar usuário');
    const data = await res.json();
    return data.profile;
  },

  // Get Question History
  getQuestionHistory: async (userId: string, questionId: string) => {
    const res = await fetch(`/api/questions/${questionId}/history?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.attempts;
  },

  // Get available filter choices and discipline hierarchy
  getFiltersMeta: async (userId?: string): Promise<DisciplinesMetaResponse> => {
    const res = await fetch(`/api/questions/filters${userId ? '?userId=' + encodeURIComponent(userId) : ''}`);
    if (!res.ok) throw new Error('Falha ao obter metadados de filtros');
    return res.json();
  },

  // Get disciplines and topics structure
  getDisciplinesAndTopics: async (): Promise<DisciplinesMetaResponse> => {
    const res = await fetch('/api/questions/disciplines-topics');
    if (!res.ok) throw new Error('Falha ao obter catálogo de disciplinas');
    return res.json();
  },

  // Create study/simulado session
  createSession: async (params: { userId: string; filters: SessionFilters }): Promise<StudySession> => {
    const res = await fetch('/api/questions/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao criar sessão' }));
      throw new Error(err.error || 'Falha ao criar sessão');
    }
    const data = await res.json();
    return data.session;
  },

  // Get active session
  getSession: async (sessionId: string): Promise<StudySession> => {
    const res = await fetch(`/api/questions/session/${sessionId}`);
    if (!res.ok) throw new Error('Sessão não encontrada');
    const data = await res.json();
    return data.session;
  },

  // Submit single answer
  submitAnswer: async (params: {
    sessionId: string;
    questionId: string;
    questionVersion: number;
    selectedAnswer: OptionKey;
    responseTimeSeconds: number;
    mode: 'study' | 'simulado';
    userId: string;
  }): Promise<{
    isCorrect?: boolean;
    correctAnswer?: OptionKey;
    explanation?: string;
    legalBasis?: string;
    recorded?: boolean;
  }> => {
    const res = await fetch('/api/questions/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Falha ao enviar resposta');
    return res.json();
  },

  // Finish session & calculate stats
  finishSession: async (sessionId: string, timeSpentSeconds: number): Promise<StudySession> => {
    const res = await fetch(`/api/questions/session/${sessionId}/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeSpentSeconds }),
    });
    if (!res.ok) throw new Error('Falha ao finalizar sessão');
    const data = await res.json();
    return data.session;
  },

  // Toggle favorite / review
  toggleFavorite: async (params: {
    userId: string;
    questionId: string;
    bookmarked?: boolean;
    needsReview?: boolean;
    notes?: string;
  }) => {
    const res = await fetch('/api/questions/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Falha ao atualizar favoritos');
    return res.json();
  },

  // Get favorites
  getUserFavorites: async (userId: string): Promise<Array<{ favorite: UserFavorite; question: SanitizedQuestion }>> => {
    const res = await fetch(`/api/user/favorites?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Falha ao obter favoritos');
    const data = await res.json();
    return data.favorites;
  },

  // Get Caderno de Erros
  getErrorNotebook: async (userId: string): Promise<ErrorNotebookSummary> => {
    const res = await fetch(`/api/user/error-notebook?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Falha ao obter Caderno de Erros');
    return res.json();
  },

  // Save/Update Note in Caderno de Erros
  updateErrorNote: async (params: { userId: string; questionId: string; userNotes: string }): Promise<any> => {
    const res = await fetch('/api/user/error-notebook/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Falha ao salvar anotação do caderno de erros');
    return res.json();
  },

  // Toggle/Update Status in Caderno de Erros
  updateErrorStatus: async (params: { userId: string; questionId: string; status: 'ativo' | 'superado' }): Promise<any> => {
    const res = await fetch('/api/user/error-notebook/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Falha ao atualizar status no caderno de erros');
    return res.json();
  },

  // Get user performance stats
  getUserStats: async (userId: string): Promise<GlobalUserStats> => {
    const res = await fetch(`/api/user/stats?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Falha ao obter estatísticas');
    const data = await res.json();
    return data.stats;
  },

  // Reset user performance stats
  resetUserStats: async (userId: string, volume?: string, caderno?: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch('/api/user/reset-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, volume, caderno }),
    });
    if (!res.ok) throw new Error('Falha ao zerar desempenho geral');
    return res.json();
  },

  // Report question problem
  reportQuestion: async (params: {
    questionId: string;
    questionVersion: number;
    userId: string;
    userEmail?: string;
    reason: ReportReason | string;
    details: string;
  }) => {
    const res = await fetch('/api/questions/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Falha ao enviar reporte');
    return res.json();
  },

  // ================= ADMIN API =================

  adminGetQuestions: async (params?: {
    search?: string;
    volume?: string;
    topic?: string;
    status?: string;
    difficulty?: string;
    type?: string;
    origin?: string;
  }): Promise<{
    questions: (Question & { auditWarnings?: any[] })[];
    total: number;
    meta?: { totalDatabase: number; addedCount: number; seedCount: number };
  }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) searchParams.append(k, v);
      });
    }
    const res = await fetch(`/api/admin/questions?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Falha ao listar questões');
    return res.json();
  },

  adminCreateQuestion: async (question: Partial<Question>): Promise<Question> => {
    const res = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao criar questão');
    }
    const data = await res.json();
    return data.question;
  },

  adminDeleteQuestion: async (id: string): Promise<{ success: boolean; deletedId: string; message: string; totalQuestions: number }> => {
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao excluir questão' }));
      throw new Error(err.error || 'Falha ao excluir questão');
    }
    return res.json();
  },

  adminBulkDeleteQuestions: async (ids: string[]): Promise<{ success: boolean; deletedCount: number; message: string; totalQuestions: number }> => {
    const res = await fetch('/api/admin/questions/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao excluir questões em lote' }));
      throw new Error(err.error || 'Falha ao excluir questões em lote');
    }
    return res.json();
  },

  adminDeleteAddedQuestions: async (): Promise<{ success: boolean; deletedCount: number; remainingCount: number; message: string }> => {
    const res = await fetch('/api/admin/questions/delete-added', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao excluir questões adicionadas' }));
      throw new Error(err.error || 'Falha ao excluir questões adicionadas');
    }
    return res.json();
  },

  adminResetAllQuestions: async (): Promise<{ success: boolean; message: string; totalQuestions: number }> => {
    const res = await fetch('/api/admin/questions/reset-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao resetar banco de questões' }));
      throw new Error(err.error || 'Falha ao resetar banco de questões');
    }
    return res.json();
  },

  adminDeleteByDiscipline: async (params: { volume: string; topic?: string } | string): Promise<{ success: boolean; deletedCount: number; message: string; totalQuestions: number }> => {
    const payload = typeof params === 'string' ? { volume: params } : params;
    const res = await fetch('/api/admin/questions/delete-by-discipline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao excluir questões por disciplina' }));
      throw new Error(err.error || 'Falha ao excluir questões por disciplina');
    }
    return res.json();
  },

  adminDeleteImportBatch: async (batchId: string): Promise<{ success: boolean; deletedCount: number; batchId: string; message: string; totalQuestions: number }> => {
    const res = await fetch(`/api/admin/imports/${encodeURIComponent(batchId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao excluir lote de importação' }));
      throw new Error(err.error || 'Falha ao excluir lote de importação');
    }
    return res.json();
  },

  adminUpdateQuestion: async (id: string, question: Partial<Question>): Promise<Question> => {
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao atualizar questão');
    }
    const data = await res.json();
    return data.question;
  },

  adminDuplicateQuestion: async (id: string): Promise<Question> => {
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(id)}/duplicate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Falha ao duplicar questão');
    const data = await res.json();
    return data.question;
  },

  adminUpdateStatus: async (id: string, status: string): Promise<Question> => {
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar status');
    const data = await res.json();
    return data.question;
  },

  adminGetVersions: async (id: string) => {
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(id)}/versions`);
    if (!res.ok) throw new Error('Falha ao obter histórico de versões');
    return res.json();
  },

  adminPreviewImport: async (questionsList: any[]): Promise<{
    summary: { total: number; nova: number; atualizacao: number; igual: number; erro: number; canImport: boolean };
    preview: ImportPreviewItem[];
    batchQualityWarnings: any[];
  }> => {
    const res = await fetch('/api/admin/import/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: questionsList }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao validar lote' }));
      throw new Error(err.error || 'Falha ao validar lote');
    }
    const data = await res.json();
    const formattedPreview: ImportPreviewItem[] = (data.items || []).map((item: any) => ({
      ...item,
      status: (item.classification || 'nova').toLowerCase() as any,
    }));
    return {
      summary: data.summary,
      preview: formattedPreview,
      batchQualityWarnings: data.batchQualityWarnings || [],
    };
  },

  adminExecuteImport: async (payload: {
    questions: Question[];
    sourceFilename?: string;
    schemaVersion?: string;
    dataset?: any;
    userEmail?: string;
  }): Promise<ImportBatchSummary> => {
    const res = await fetch('/api/admin/import/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schemaVersion: payload.schemaVersion || '1.0',
        dataset: payload.dataset || { name: payload.sourceFilename || 'Importação Manual' },
        questions: payload.questions,
        userEmail: payload.userEmail,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao processar importação' }));
      throw new Error(err.error || 'Falha ao processar importação');
    }
    const data = await res.json();
    return {
      ...data.batchSummary,
      batchId: data.batchSummary?.id || data.batchSummary?.batchId,
      createdCount: data.batchSummary?.insertedCount ?? data.batchSummary?.createdCount ?? 0,
      updatedCount: data.batchSummary?.updatedCount ?? 0,
      skippedCount: data.batchSummary?.ignoredCount ?? data.batchSummary?.skippedCount ?? 0,
      totalProcessed: data.batchSummary?.totalQuestions ?? data.batchSummary?.totalProcessed ?? payload.questions.length,
    };
  },

  adminGetImportBatches: async (): Promise<ImportBatchSummary[]> => {
    const res = await fetch('/api/admin/imports');
    if (!res.ok) throw new Error('Falha ao obter histórico de importações');
    const data = await res.json();
    return (data.imports || []).map((b: any) => ({
      ...b,
      batchId: b.id || b.batchId,
      createdCount: b.insertedCount ?? b.createdCount ?? 0,
      updatedCount: b.updatedCount ?? 0,
      skippedCount: b.ignoredCount ?? b.skippedCount ?? 0,
      totalProcessed: b.totalQuestions ?? b.totalProcessed ?? 0,
    }));
  },

  adminGetReports: async (status?: string): Promise<QuestionReport[]> => {
    const res = await fetch('/api/admin/reports');
    if (!res.ok) throw new Error('Falha ao obter relatórios de problemas');
    const data = await res.json();
    let list: QuestionReport[] = (data.reports || []).map((r: any) => ({
      ...r,
      adminNote: r.adminNotes || r.adminNote,
    }));
    if (status && status !== 'todos') {
      list = list.filter((r) => r.status === status);
    }
    return list;
  },

  adminResolveReport: async (id: string, status: 'resolvido' | 'descartado', adminNote?: string) => {
    const res = await fetch(`/api/admin/reports/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes: adminNote }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar relatório');
    return res.json();
  },
};
