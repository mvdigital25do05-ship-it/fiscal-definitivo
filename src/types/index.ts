export type Difficulty = 'facil' | 'media' | 'dificil';

export type QuestionType =
  | 'lei_seca'
  | 'conceitual'
  | 'caso_pratico'
  | 'integracao'
  | 'prazo_numero'
  | 'assertivas';

export type QuestionStatus = 'rascunho' | 'revisar' | 'revisada' | 'desativada';

export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Formato Oficial Simplificado de Importação de Questões
 */
export interface OfficialQuestionImport {
  id: string;
  disciplina: string;
  caderno?: string;
  notebook?: string;
  booklet?: string;
  topico: string;
  subtopico?: string;
  enunciado: string;
  alternativas: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
    [key: string]: string | undefined;
  };
  gabarito: OptionKey | string;
  comentario: string;
  fundamento?: string;
  // Campos opcionais de calibração/versão:
  versao?: number;
  version?: number;
  dificuldade?: 'facil' | 'media' | 'dificil' | 'fácil' | 'média' | 'difícil';
  tipo?: QuestionType;
  status?: QuestionStatus;
  tags?: string[];
}

export interface Question {
  id: string; // e.g. "trib-ctn-001"
  version: number;
  volume: string; // Disciplina e.g. "Conhecimentos Específicos", "Direito Tributário"
  caderno: string; // Caderno e.g. "Caderno 1", "Sem caderno"
  topic: string; // Tópico e.g. "Crédito Tributário", "ICMS"
  subtopic?: string; // Subtópico
  difficulty: Difficulty;
  type: QuestionType;
  status: QuestionStatus;
  statement: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  answer: OptionKey;
  explanation: string;
  legalBasis?: string;
  tags: string[];
  isCustom?: boolean;
  batchId?: string;
  createdAt?: number;
  updatedAt?: number;
  quality?: {
    audited?: boolean;
    warningsCount?: number;
    lastAuditedAt?: number;
  };
}

export interface SanitizedQuestion {
  id: string;
  version: number;
  volume: string;
  caderno: string;
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  type: QuestionType;
  statement: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  tags: string[];
  isCustom?: boolean;
  batchId?: string;
  // Revealed only after answer validation or simulado conclusion:
  answer?: OptionKey;
  explanation?: string;
  legalBasis?: string;
  userAnswer?: OptionKey;
  isCorrect?: boolean;
}

export interface QuestionVersionSnapshot {
  versionId: string;
  questionId: string;
  version: number;
  dataSnapshot: Question;
  timestamp: number;
  changedBy?: string;
  changeNote?: string;
}

export type PersonalStatusFilter = 'todas' | 'ineditas' | 'acertadas' | 'erradas' | 'caderno_erros' | 'favoritas' | 'revisao';
export type OrderFilter = 'aleatoria' | 'recentes' | 'antigas' | 'maior_taxa_erro';

export interface ErrorNotebookItem {
  questionId: string;
  userId: string;
  status: 'ativo' | 'superado';
  userNotes?: string;
  totalErrors: number;
  totalSuccessAfterError: number;
  lastErrorTimestamp: number;
  lastAttemptTimestamp: number;
  lastAttemptCorrect: boolean;
  question: SanitizedQuestion;
}

export interface ErrorNotebookSummary {
  totalUniqueErrors: number;
  activeErrorsCount: number;
  superadoCount: number;
  byDiscipline: Record<string, number>;
  items: ErrorNotebookItem[];
}

export interface SessionFilters {
  volume?: string; // Disciplina
  caderno?: string; // Caderno
  topic?: string; // Tópico
  subtopic?: string; // Subtópico
  difficulty?: Difficulty | 'todas';
  type?: QuestionType | 'todas';
  personalStatus?: PersonalStatusFilter;
  count?: number;
  order?: OrderFilter;
  mode?: 'study' | 'simulado';
  timeLimitMinutes?: number; // 0 for unlimited
}

export interface SessionAnswerState {
  selectedAnswer?: OptionKey;
  isCorrect?: boolean;
  correctAnswer?: OptionKey;
  explanation?: string;
  legalBasis?: string;
  timestamp: number;
  responseTimeSeconds?: number;
}

export interface SessionStats {
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  blank: number;
  percentage: number;
  timeSpentSeconds: number;
  topicBreakdown: Record<string, { total: number; correct: number; wrong: number; percentage: number }>;
  difficultyBreakdown: Record<string, { total: number; correct: number; wrong: number }>;
}

export interface StudySession {
  id: string;
  userId: string;
  mode: 'study' | 'simulado';
  title: string;
  filters: SessionFilters;
  questionIds: string[];
  questions: SanitizedQuestion[];
  currentIndex: number;
  answers: Record<string, SessionAnswerState>;
  bookmarked: Record<string, boolean>;
  needsReview: Record<string, boolean>;
  completed: boolean;
  startedAt: number;
  completedAt?: number;
  timeSpentSeconds: number;
  timeLimitSeconds?: number;
  stats?: SessionStats;
}

export interface QuestionAttempt {
  id: string;
  userId: string;
  questionId: string;
  questionVersion: number;
  selectedAnswer: OptionKey;
  isCorrect: boolean;
  hiddenFromStats?: boolean;
  mode: 'study' | 'simulado';
  sessionId?: string;
  timestamp: number;
  responseTimeSeconds: number;
  volume: string;
  caderno?: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  type: QuestionType;
}

export interface UserFavorite {
  questionId: string;
  bookmarked: boolean;
  needsReview: boolean;
  notes?: string;
  updatedAt: number;
}

export type ReportReason =
  | 'gabarito_incorreto'
  | 'enunciado_ambiguo'
  | 'desatualizada'
  | 'erro_digitacao'
  | 'gabarito_duvidoso'
  | 'resposta_denunciada_tamanho'
  | 'distratores_fracos'
  | 'enunciado_confuso'
  | 'questao_repetida'
  | 'comentario_insuficiente'
  | 'norma_incorreta'
  | 'muito_facil'
  | 'outro';

export interface QuestionReport {
  id: string;
  questionId: string;
  questionVersion: number;
  userId: string;
  userEmail?: string;
  reason: ReportReason | string;
  details: string;
  status: 'pendente' | 'resolvido' | 'descartado';
  createdAt: number;
  resolvedAt?: number;
  adminNote?: string;
  adminNotes?: string;
}

export interface QualityAuditWarning {
  code:
    | 'CORRECT_OPTION_TOO_LONG'
    | 'CATEGORICAL_WORDS_IN_WRONG'
    | 'DISTRACTORS_TOO_SHORT'
    | 'POSSIBLE_DUPLICATE_STATEMENT'
    | 'HIGH_TYPE_CONCENTRATION'
    | 'UNBALANCED_ANSWER_DISTRIBUTION'
    | 'REPEATED_ANSWER_STREAK'
    | 'MISSING_EXPLANATION_OR_LEGAL_BASIS'
    | 'OPTION_MISSING_OR_EMPTY';
  severity: 'warning' | 'info';
  message: string;
  questionId?: string;
  details?: string;
}

export type ImportClassification = 'NOVA' | 'ATUALIZACAO' | 'IGUAL' | 'ERRO';

export interface ImportPreviewItem {
  status?: 'nova' | 'atualizacao' | 'igual' | 'erro';
  classification?: ImportClassification;
  question: Question;
  existingQuestion?: Question;
  reason?: string;
  auditWarnings?: QualityAuditWarning[];
  errors?: string[];
  diffSummary?: string;
}

export interface ImportBatchSummary {
  id?: string;
  batchId?: string;
  schemaVersion?: string;
  datasetName?: string;
  sourceFilename?: string;
  importedBy?: string;
  timestamp: number;
  totalQuestions?: number;
  totalProcessed?: number;
  insertedCount?: number;
  createdCount?: number;
  updatedCount?: number;
  ignoredCount?: number;
  skippedCount?: number;
  errorCount?: number;
  errors?: string[];
  warnings?: string[];
  questionIds?: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: number;
  lastLoginAt?: number;
}

export interface TopicSummary {
  name: string;
  questionCount: number;
  subtopics: string[];
}

export interface CadernoSummary {
  name: string;
  questionCount: number;
  topics: TopicSummary[];
}

export interface DisciplineSummary {
  name: string;
  questionCount: number;
  cadernos?: CadernoSummary[];
  topics: TopicSummary[];
}

export interface DisciplinesMetaResponse {
  totalQuestions: number;
  totalDisciplines: number;
  totalCadernos?: number;
  totalTopics: number;
  disciplines: DisciplineSummary[];
  volumes: string[];
  cadernosByVolume?: Record<string, string[]>;
  topicsByVolume: Record<string, string[]>;
  topicsByVolumeCaderno?: Record<string, Record<string, string[]>>;
  subtopicsByTopic: Record<string, string[]>;
  cadernoCounts?: Record<string, Record<string, number>>;
  cadernoDoneCounts?: Record<string, Record<string, number>>;
  topicCounts?: Record<string, Record<string, Record<string, number>>>;
  topicDoneCounts?: Record<string, Record<string, Record<string, number>>>;
  difficultyCounts: Record<string, number>;
  typeCounts: Record<string, number>;
}

export interface GlobalUserStats {
  uniqueQuestionsAnswered: number;
  totalAttempts: number;
  totalCorrect: number;
  totalWrong: number;
  globalAccuracy: number;
  firstAttemptAccuracy: number;
  recentAttemptAccuracy: number;
  volumeStats: Record<string, { total: number; answered: number; correct: number; accuracy: number }>;
  cadernoStats?: Record<string, { total: number; answered: number; correct: number; accuracy: number }>;
  topicStats: Record<string, { total: number; answered: number; correct: number; accuracy: number }>;
  difficultyStats: Record<Difficulty, { total: number; answered: number; correct: number; accuracy: number }>;
  typeStats: Record<QuestionType, { total: number; answered: number; correct: number; accuracy: number }>;
  evolutionData: Array<{ date: string; accuracy: number; total: number; correct: number }>;
  mostMissedQuestions: Array<{
    questionId: string;
    volume: string;
    topic: string;
    statement: string;
    wrongCount: number;
    totalAttempts: number;
    lastAttemptDate: number;
  }>;
}

