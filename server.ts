import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { SEED_QUESTIONS } from './src/data/seedQuestions';
import { auditSingleQuestion, auditBatchQuality } from './src/lib/audit';
import { normalizeImportQuestion, validateOfficialQuestion } from './src/lib/questionNormalize';
import type {
  Question,
  SanitizedQuestion,
  QuestionVersionSnapshot,
  StudySession,
  QuestionAttempt,
  UserFavorite,
  QuestionReport,
  ImportBatchSummary,
  ImportPreviewItem,
  GlobalUserStats,
  UserProfile,
} from './src/types';

// Load Firebase configuration
let firebaseConfig: any = null;
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error('Error reading firebase-applet-config.json:', err);
  }
}

// In-memory caches for high performance
const questionsMap = new Map<string, Question>();
const questionVersionsMap = new Map<string, QuestionVersionSnapshot[]>();
const sessionsMap = new Map<string, StudySession>();
const attemptsMap = new Map<string, QuestionAttempt[]>(); // userId -> attempts
const favoritesMap = new Map<string, Map<string, UserFavorite>>(); // userId -> questionId -> UserFavorite
interface ErrorNotebookMeta {
  questionId: string;
  status?: 'ativo' | 'superado';
  userNotes?: string;
  updatedAt: number;
}
const errorNotebookMap = new Map<string, Map<string, ErrorNotebookMeta>>(); // userId -> questionId -> ErrorNotebookMeta
const reportsMap = new Map<string, QuestionReport>();
const cadernoSequencesMap = new Map<string, string[]>(); // key -> questionIds

const importsMap = new Map<string, ImportBatchSummary>();
const usersMap = new Map<string, UserProfile>();

const LEGACY_SEED_QUESTION_IDS = new Set([
  'trib-ctn-001',
  'trib-const-002',
  'trib-ext-003',
  'leg-icms-004',
  'leg-iss-005',
  'cont-cpc16-006',
  'cont-cpc01-007',
  'aud-nbcta230-008',
  'aud-nbcta700-009',
  'const-trib-010',
  'adm-atos-011',
  'adm-licit-012',
  'trib-lanc-013',
  'cont-dfc-014',
  'leg-pat-015',
]);

const SEED_QUESTION_IDS = new Set(SEED_QUESTIONS.map((q) => q.id));

// Setup default admin user
const defaultAdminUser: UserProfile = {
  uid: 'admin-auditor-fisco',
  email: 'auditor.fiscal@receita.gov.br',
  displayName: 'Auditor Fiscal (Admin)',
  role: 'admin',
  createdAt: Date.now() - 86400000 * 30,
  lastLoginAt: Date.now(),
};
usersMap.set(defaultAdminUser.uid, defaultAdminUser);

// Try initializing Firestore if config exists
let firestoreDb: any = null;
if (firebaseConfig && firebaseConfig.projectId) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firestoreDb = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
    console.log('[Firebase] Firestore initialized on server successfully.');
  } catch (e) {
    console.warn('[Firebase] Server initialization warning:', e);
  }
}

// Ensure local persistence data folder exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

function saveDiskFile(filename: string, data: any) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn(`Error writing disk backup ${filename}:`, err);
  }
}

function readDiskFile<T>(filename: string, fallback: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.warn(`Error reading disk backup ${filename}:`, err);
  }
  return fallback;
}

function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && data.constructor === Object) {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned;
  }
  return data;
}

// Persistence Helper Functions (Dual Layer: In-Memory + Disk + Firestore)
async function persistQuestion(q: Question) {
  q.caderno = q.caderno || 'Sem caderno';
  questionsMap.set(q.id, q);
  saveDiskFile('questions_db.json', Array.from(questionsMap.values()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'questions', q.id), cleanForFirestore(q)).catch(e => console.warn(`Firestore save error for question ${q.id}:`, e));
  }
}

async function persistQuestionsBatch(questions: Question[]) {
  questions.forEach((q) => {
    q.caderno = q.caderno || 'Sem caderno';
    questionsMap.set(q.id, q);
  });
  saveDiskFile('questions_db.json', Array.from(questionsMap.values()));
  if (firestoreDb) {
    for (const q of questions) {
      setDoc(doc(firestoreDb, 'questions', q.id), cleanForFirestore(q)).catch(e => console.warn(`Firestore batch error for question ${q.id}:`, e));
    }
  }
}

async function removeQuestion(id: string) {
  questionsMap.delete(id);
  questionVersionsMap.delete(id);

  // Track deleted IDs on disk
  const deletedList = readDiskFile<string[]>('deleted_questions_db.json', []);
  if (!deletedList.includes(id)) {
    deletedList.push(id);
    saveDiskFile('deleted_questions_db.json', deletedList);
  }

  saveDiskFile('questions_db.json', Array.from(questionsMap.values()));
  saveDiskFile('question_versions_db.json', Array.from(questionVersionsMap.entries()));
  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'questions', id)).catch(e => console.warn(`Firestore delete error for question ${id}:`, e));
  }
}

async function persistVersionSnapshot(snap: QuestionVersionSnapshot) {
  let list = questionVersionsMap.get(snap.questionId) || [];
  list = list.filter((v) => v.versionId !== snap.versionId);
  list.push(snap);
  questionVersionsMap.set(snap.questionId, list);
  saveDiskFile('question_versions_db.json', Array.from(questionVersionsMap.entries()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'questionVersions', snap.versionId), cleanForFirestore(snap)).catch(e => console.warn(`Firestore error saving version ${snap.versionId}:`, e));
  }
}

async function persistImportBatch(batch: ImportBatchSummary) {
  importsMap.set(batch.batchId, batch);
  saveDiskFile('imports_db.json', Array.from(importsMap.values()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'imports', batch.batchId), cleanForFirestore(batch)).catch(e => console.warn(`Firestore error saving import batch ${batch.batchId}:`, e));
  }
}

async function removeImportBatch(batchId: string) {
  importsMap.delete(batchId);
  saveDiskFile('imports_db.json', Array.from(importsMap.values()));
  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'imports', batchId)).catch(e => console.warn(`Firestore error deleting import batch ${batchId}:`, e));
  }
}

async function persistUser(user: UserProfile) {
  usersMap.set(user.uid, user);
  saveDiskFile('users_db.json', Array.from(usersMap.values()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', user.uid), cleanForFirestore(user), { merge: true }).catch(e => console.warn(`Firestore error saving user ${user.uid}:`, e));
  }
}

async function persistAttempt(attempt: QuestionAttempt) {
  let list = attemptsMap.get(attempt.userId) || [];
  list.push(attempt);
  attemptsMap.set(attempt.userId, list);
  saveDiskFile('attempts_db.json', Array.from(attemptsMap.entries()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', attempt.userId, 'attempts', attempt.id), cleanForFirestore(attempt)).catch(e => console.warn(`Firestore error saving attempt ${attempt.id}:`, e));
  }
}

async function persistFavorite(userId: string, fav: UserFavorite) {
  let userFavs = favoritesMap.get(userId);
  if (!userFavs) {
    userFavs = new Map<string, UserFavorite>();
    favoritesMap.set(userId, userFavs);
  }
  userFavs.set(fav.questionId, fav);
  const serialized = Array.from(favoritesMap.entries()).map(([uid, map]) => [uid, Array.from(map.entries())]);
  saveDiskFile('favorites_db.json', serialized);
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', userId, 'favorites', fav.questionId), cleanForFirestore(fav)).catch(e => console.warn(`Firestore error saving favorite for ${fav.questionId}:`, e));
  }
}

async function persistSession(session: StudySession) {
  sessionsMap.set(session.id, session);
  saveDiskFile('sessions_db.json', Array.from(sessionsMap.values()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', session.userId, 'sessions', session.id), cleanForFirestore({ ...session, questions: [] })).catch(e => console.warn(`Firestore error saving session ${session.id}:`, e));
  }
}

async function persistErrorNotebookMeta(userId: string, questionId: string, meta: ErrorNotebookMeta) {
  let userMap = errorNotebookMap.get(userId);
  if (!userMap) {
    userMap = new Map();
    errorNotebookMap.set(userId, userMap);
  }
  userMap.set(questionId, meta);

  const serialized = Array.from(errorNotebookMap.entries()).map(([uid, map]) => [
    uid,
    Array.from(map.entries()),
  ]);
  saveDiskFile('error_notebook_db.json', serialized);
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', userId, 'error_notebook', questionId), cleanForFirestore(meta)).catch(e => console.warn(`Firestore error saving error notebook for ${questionId}:`, e));
  }
}

function getUserErrorNotebook(userId: string) {
  const userAttempts = attemptsMap.get(userId) || [];
  const userOverrides = errorNotebookMap.get(userId) || new Map();

  const attemptsByQuestion = new Map<string, QuestionAttempt[]>();
  for (const att of userAttempts) {
    let list = attemptsByQuestion.get(att.questionId);
    if (!list) {
      list = [];
      attemptsByQuestion.set(att.questionId, list);
    }
    list.push(att);
  }

  const items: any[] = [];
  const byDiscipline: Record<string, number> = {};

  attemptsByQuestion.forEach((attempts, qId) => {
    const question = questionsMap.get(qId);
    if (!question || question.status === 'desativada') return;

    const wrongAttempts = attempts.filter((a) => !a.isCorrect);
    if (wrongAttempts.length === 0) return;

    const sortedAttempts = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
    const lastAttempt = sortedAttempts[sortedAttempts.length - 1];
    const sortedWrong = [...wrongAttempts].sort((a, b) => a.timestamp - b.timestamp);
    const lastError = sortedWrong[sortedWrong.length - 1];

    const totalErrors = wrongAttempts.length;
    const totalSuccessAfterError = attempts.filter((a) => a.isCorrect && a.timestamp > lastError.timestamp).length;

    const override = userOverrides.get(qId);
    let status: 'ativo' | 'superado' = override?.status
      ? override.status
      : (lastAttempt.isCorrect && totalSuccessAfterError >= 1) ? 'superado' : 'ativo';

    const item = {
      questionId: qId,
      userId,
      status,
      userNotes: override?.userNotes || '',
      totalErrors,
      totalSuccessAfterError,
      lastErrorTimestamp: lastError.timestamp,
      lastAttemptTimestamp: lastAttempt.timestamp,
      lastAttemptCorrect: lastAttempt.isCorrect,
      question: sanitizeQuestion(question),
    };

    items.push(item);

    const discName = question.volume || 'Geral';
    byDiscipline[discName] = (byDiscipline[discName] || 0) + 1;
  });

  items.sort((a, b) => b.lastErrorTimestamp - a.lastErrorTimestamp);

  const activeErrorsCount = items.filter((i) => i.status === 'ativo').length;
  const superadoCount = items.filter((i) => i.status === 'superado').length;

  return {
    totalUniqueErrors: items.length,
    activeErrorsCount,
    superadoCount,
    byDiscipline,
    items,
  };
}

async function bootstrapDatabase() {
  console.log('[Storage] Initializing Fiscal Questões persistent database...');

  // 1. Load users from disk
  const diskUsers = readDiskFile<UserProfile[]>('users_db.json', []);
  diskUsers.forEach((u) => usersMap.set(u.uid, u));

  // 2. Load imports from disk
  const diskImports = readDiskFile<ImportBatchSummary[]>('imports_db.json', []);
  diskImports.forEach((b) => importsMap.set(b.batchId, b));

  // 3. Load question versions from disk
  const diskVersions = readDiskFile<[string, QuestionVersionSnapshot[]][]>('question_versions_db.json', []);
  diskVersions.forEach(([qId, snaps]) => questionVersionsMap.set(qId, snaps));

  // 4. Load attempts from disk
  const diskAttempts = readDiskFile<[string, QuestionAttempt[]][]>('attempts_db.json', []);
  diskAttempts.forEach(([uid, list]) => attemptsMap.set(uid, list));

  // 5. Load favorites from disk
  const diskFavs = readDiskFile<[string, [string, UserFavorite][]][]>('favorites_db.json', []);
  diskFavs.forEach(([uid, list]) => {
    const map = new Map<string, UserFavorite>();
    list.forEach(([qId, fav]) => map.set(qId, fav));
    favoritesMap.set(uid, map);
  });

  // 5.1. Load error notebook from disk
  const diskErrorNotebook = readDiskFile<[string, [string, ErrorNotebookMeta][]][]>('error_notebook_db.json', []);
  diskErrorNotebook.forEach(([uid, list]) => {
    const map = new Map<string, ErrorNotebookMeta>();
    list.forEach(([qId, meta]) => map.set(qId, meta));
    errorNotebookMap.set(uid, map);
  });

  // 6. Load sessions from disk
  const diskSessions = readDiskFile<StudySession[]>('sessions_db.json', []);
  diskSessions.forEach((s) => sessionsMap.set(s.id, s));

  // 7. Load Questions from Disk and Firestore
  const diskQuestions = readDiskFile<Question[]>('questions_db.json', []);
  const deletedQuestionIds = readDiskFile<string[]>('deleted_questions_db.json', []);
  const diskSequences = readDiskFile<[string, string[]][]>('caderno_sequences_db.json', []);
  diskSequences.forEach(([k, v]) => cadernoSequencesMap.set(k, v));
  const deletedSet = new Set(deletedQuestionIds);

  if (diskQuestions.length > 0) {
    diskQuestions.forEach((q) => {
      if (!deletedSet.has(q.id) && !LEGACY_SEED_QUESTION_IDS.has(q.id)) {
        q.caderno = q.caderno || 'Sem caderno';
        questionsMap.set(q.id, q);
      }
    });
  }

  if (firestoreDb) {
    try {
      const qSnap = await getDocs(collection(firestoreDb, 'questions'));
      if (qSnap.docs.length > 0) {
        qSnap.docs.forEach((docSnap) => {
          const qData = docSnap.data() as Question;
          if (deletedSet.has(qData.id) || LEGACY_SEED_QUESTION_IDS.has(qData.id)) {
            deleteDoc(doc(firestoreDb, 'questions', qData.id)).catch(() => {});
            questionsMap.delete(qData.id);
          } else {
            qData.caderno = qData.caderno || 'Sem caderno';
            questionsMap.set(qData.id, qData);
          }
        });
      }
    } catch (e) {
      console.warn('[Storage] Could not fetch questions from Firestore, using local disk cache:', e);
    }
  }

  saveDiskFile('questions_db.json', Array.from(questionsMap.values()));
  if (firestoreDb) {
    Array.from(questionsMap.values()).forEach((q) => {
      setDoc(doc(firestoreDb, 'questions', q.id), cleanForFirestore(q)).catch(() => {});
    });
  }

  console.log(`[Storage] Database ready with ${questionsMap.size} active questions.`);
}

// Helper to sanitize question for client transmission
function sanitizeQuestion(q: Question): SanitizedQuestion {
  const { answer, explanation, legalBasis, ...rest } = q;
  return {
    ...rest,
    tags: rest.tags || [],
  };
}

async function startServer() {
  // Bootstrap persistent storage before handling requests
  await bootstrapDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), totalQuestions: questionsMap.size });
  });

  // 2. Auth & Profile Sync
  app.post('/api/auth/sync', async (req, res) => {
    const { uid, email, displayName, photoURL, role } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'Missing UID' });
    }

    let existing = usersMap.get(uid);
    const isAdminEmail =
      email &&
      (email.includes('admin') ||
        email.includes('fisco') ||
        email === 'matheusleal25do05@gmail.com' ||
        role === 'admin');

    if (!existing) {
      existing = {
        uid,
        email: email || 'estudante@fisco.gov.br',
        displayName: displayName || 'Concurseiro Fiscal',
        photoURL: photoURL || '',
        role: isAdminEmail ? 'admin' : (role || 'admin'),
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
    } else {
      existing.lastLoginAt = Date.now();
      if (email) existing.email = email;
      if (displayName) existing.displayName = displayName;
      if (photoURL) existing.photoURL = photoURL;
      if (isAdminEmail || role === 'admin') existing.role = 'admin';
    }

    await persistUser(existing);
    res.json({ profile: existing });
  });

  // 3. Metadata & Filters list
  app.get('/api/questions/filters', (req, res) => {
    const uid = req.query.userId as string;
    const activeQuestions = Array.from(questionsMap.values()).filter((q) => q.status !== 'desativada');

    const userAttempts = uid ? (attemptsMap.get(uid) || []).filter(a => !a.hiddenFromStats) : [];
    const doneQuestions = new Set(userAttempts.map(a => a.questionId));

    const volumeDoneCounts: Record<string, number> = {};
    const cadernoDoneCounts: Record<string, Record<string, number>> = {};
    const topicDoneCounts: Record<string, Record<string, Record<string, number>>> = {};

    const volumesSet = new Set<string>();
    const cadernosByVolumeMap: Record<string, Set<string>> = {};
    const topicsByVolumeCadernoMap: Record<string, Record<string, Set<string>>> = {};
    const subtopicsByTopicMap: Record<string, Set<string>> = {};

    const volumeCounts: Record<string, number> = {};
    const cadernoCounts: Record<string, Record<string, number>> = {};
    const topicCounts: Record<string, Record<string, Record<string, number>>> = {};

    const difficultyCounts: Record<string, number> = { facil: 0, media: 0, dificil: 0 };
    const typeCounts: Record<string, number> = {};

    activeQuestions.forEach((q) => {
      const vol = q.volume || 'Conhecimentos Gerais';
      const cad = q.caderno || 'Sem caderno';
      const top = q.topic || 'Geral';
      const sub = q.subtopic;

      volumesSet.add(vol);
      volumeCounts[vol] = (volumeCounts[vol] || 0) + 1;

      if (!cadernosByVolumeMap[vol]) cadernosByVolumeMap[vol] = new Set();
      cadernosByVolumeMap[vol].add(cad);

      if (!cadernoCounts[vol]) cadernoCounts[vol] = {};
      cadernoCounts[vol][cad] = (cadernoCounts[vol][cad] || 0) + 1;

      if (!topicsByVolumeCadernoMap[vol]) topicsByVolumeCadernoMap[vol] = {};
      if (!topicsByVolumeCadernoMap[vol][cad]) topicsByVolumeCadernoMap[vol][cad] = new Set();
      topicsByVolumeCadernoMap[vol][cad].add(top);

      if (!topicCounts[vol]) topicCounts[vol] = {};
      if (!topicCounts[vol][cad]) topicCounts[vol][cad] = {};
      topicCounts[vol][cad][top] = (topicCounts[vol][cad][top] || 0) + 1;

      const isDone = doneQuestions.has(q.id);
      if (isDone) {
        volumeDoneCounts[vol] = (volumeDoneCounts[vol] || 0) + 1;
        if (!cadernoDoneCounts[vol]) cadernoDoneCounts[vol] = {};
        cadernoDoneCounts[vol][cad] = (cadernoDoneCounts[vol][cad] || 0) + 1;
        if (!topicDoneCounts[vol]) topicDoneCounts[vol] = {};
        if (!topicDoneCounts[vol][cad]) topicDoneCounts[vol][cad] = {};
        topicDoneCounts[vol][cad][top] = (topicDoneCounts[vol][cad][top] || 0) + 1;
      }

      if (sub) {
        if (!subtopicsByTopicMap[top]) subtopicsByTopicMap[top] = new Set();
        subtopicsByTopicMap[top].add(sub);
      }

      if (q.difficulty) {
        difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
      }
      if (q.type) {
        typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
      }
    });

    const volumes = Array.from(volumesSet);

    let totalTopicsCount = 0;
    let totalCadernosCount = 0;

    const cadernosByVolume: Record<string, string[]> = {};
    const topicsByVolume: Record<string, string[]> = {};

    volumes.forEach((vol) => {
      const cads = Array.from(cadernosByVolumeMap[vol] || []);
      totalCadernosCount += cads.length;
      cadernosByVolume[vol] = cads;

      const topicsSetForVol = new Set<string>();
      cads.forEach((cad) => {
        const tops = Array.from(topicsByVolumeCadernoMap[vol]?.[cad] || []);
        tops.forEach((t) => topicsSetForVol.add(t));
      });
      topicsByVolume[vol] = Array.from(topicsSetForVol);
      totalTopicsCount += topicsSetForVol.size;
    });
    
    const topicsByVolumeCaderno = {};
    Object.keys(topicsByVolumeCadernoMap).forEach(vol => {
      topicsByVolumeCaderno[vol] = {};
      Object.keys(topicsByVolumeCadernoMap[vol]).forEach(cad => {
        topicsByVolumeCaderno[vol][cad] = Array.from(topicsByVolumeCadernoMap[vol][cad]);
      });
    });

    const subtopicsByTopic: Record<string, string[]> = {};
    Object.entries(subtopicsByTopicMap).forEach(([t, set]) => {
      subtopicsByTopic[t] = Array.from(set);
    });

    const disciplines = volumes.map((vol) => {
      const cadernosList = Array.from(cadernosByVolumeMap[vol] || []);
      const cadernos = cadernosList.map((cad) => {
        const topicList = Array.from(topicsByVolumeCadernoMap[vol]?.[cad] || []);
        const topics = topicList.map((top) => ({
          name: top,
          questionCount: topicCounts[vol]?.[cad]?.[top] || 0,
          doneCount: topicDoneCounts[vol]?.[cad]?.[top] || 0,
          subtopics: Array.from(subtopicsByTopicMap[top] || []),
        }));

        return {
          name: cad,
          questionCount: cadernoCounts[vol]?.[cad] || 0,
          doneCount: cadernoDoneCounts[vol]?.[cad] || 0,
          topics,
        };
      });

      return {
        name: vol,
        questionCount: volumeCounts[vol] || 0,
        doneCount: volumeDoneCounts[vol] || 0,
        cadernos,
      };
    });

    res.json({
      totalQuestions: activeQuestions.length,
      totalDisciplines: volumes.length,
      totalCadernos: totalCadernosCount,
      totalTopics: totalTopicsCount,
      disciplines,
      volumes,
      cadernosByVolume,
      topicsByVolume,
      topicsByVolumeCaderno,
      subtopicsByTopic,
      cadernoCounts,
      cadernoDoneCounts,
      topicCounts,
      topicDoneCounts,
      difficultyCounts,
      typeCounts,
    });
  });

  // Alias for disciplines and topics hierarchy
  app.get('/api/questions/disciplines-topics', (req, res) => {
    const activeQuestions = Array.from(questionsMap.values()).filter((q) => q.status !== 'desativada');
    const volumesSet = new Set<string>();
    const cadernosByVolumeMap: Record<string, Set<string>> = {};
    const topicsByVolumeCadernoMap: Record<string, Record<string, Set<string>>> = {};
    const subtopicsByTopicMap: Record<string, Set<string>> = {};

    const volumeCounts: Record<string, number> = {};
    const cadernoCounts: Record<string, Record<string, number>> = {};
    const topicCounts: Record<string, Record<string, Record<string, number>>> = {};

    activeQuestions.forEach((q) => {
      const vol = q.volume || 'Conhecimentos Gerais';
      const cad = q.caderno || 'Sem caderno';
      const top = q.topic || 'Geral';
      const sub = q.subtopic;

      volumesSet.add(vol);
      volumeCounts[vol] = (volumeCounts[vol] || 0) + 1;

      if (!cadernosByVolumeMap[vol]) cadernosByVolumeMap[vol] = new Set();
      cadernosByVolumeMap[vol].add(cad);

      if (!cadernoCounts[vol]) cadernoCounts[vol] = {};
      cadernoCounts[vol][cad] = (cadernoCounts[vol][cad] || 0) + 1;

      if (!topicsByVolumeCadernoMap[vol]) topicsByVolumeCadernoMap[vol] = {};
      if (!topicsByVolumeCadernoMap[vol][cad]) topicsByVolumeCadernoMap[vol][cad] = new Set();
      topicsByVolumeCadernoMap[vol][cad].add(top);

      if (!topicCounts[vol]) topicCounts[vol] = {};
      if (!topicCounts[vol][cad]) topicCounts[vol][cad] = {};
      topicCounts[vol][cad][top] = (topicCounts[vol][cad][top] || 0) + 1;

      if (sub) {
        if (!subtopicsByTopicMap[top]) subtopicsByTopicMap[top] = new Set();
        subtopicsByTopicMap[top].add(sub);
      }
    });

    const volumes = Array.from(volumesSet);
    let totalTopicsCount = 0;
    let totalCadernosCount = 0;

    const disciplines = volumes.map((vol) => {
      const cadernosList = Array.from(cadernosByVolumeMap[vol] || []);
      totalCadernosCount += cadernosList.length;

      const cadernos = cadernosList.map((cad) => {
        const topicList = Array.from(topicsByVolumeCadernoMap[vol]?.[cad] || []);
        totalTopicsCount += topicList.length;

        const topics = topicList.map((top) => ({
          name: top,
          questionCount: topicCounts[vol]?.[cad]?.[top] || 0,
          subtopics: Array.from(subtopicsByTopicMap[top] || []),
        }));

        return {
          name: cad,
          questionCount: cadernoCounts[vol]?.[cad] || 0,
          topics,
        };
      });

      return {
        name: vol,
        questionCount: volumeCounts[vol] || 0,
        cadernos,
      };
    });

    res.json({
      totalQuestions: activeQuestions.length,
      totalDisciplines: volumes.length,
      totalCadernos: totalCadernosCount,
      totalTopics: totalTopicsCount,
      disciplines,
    });
  });

  // 4. Create Study / Simulado Session
  app.post('/api/questions/session/create', async (req, res) => {
    const { userId, filters } = req.body;
    const uid = userId || 'demo-user';

    let available = Array.from(questionsMap.values()).filter((q) => q.status !== 'desativada');

    // Filter by volume
    if (filters?.volume && filters.volume !== 'todas') {
      available = available.filter((q) => q.volume === filters.volume);
    }
    // Filter by caderno
    if (filters?.caderno && filters.caderno !== 'todos' && filters.caderno !== 'todas') {
      available = available.filter((q) => (q.caderno || 'Sem caderno') === filters.caderno);
    }
    // Filter by topic
    if (filters?.topic && filters.topic !== 'todos') {
      available = available.filter((q) => q.topic === filters.topic);
    }
    // Filter by subtopic
    if (filters?.subtopic && filters.subtopic !== 'todos') {
      available = available.filter((q) => q.subtopic === filters.subtopic);
    }
    // Filter by difficulty
    if (filters.difficulty && filters.difficulty !== 'todas') {
      available = available.filter((q) => q.difficulty === filters.difficulty);
    }
    // Filter by type
    if (filters.type && filters.type !== 'todas') {
      available = available.filter((q) => q.type === filters.type);
    }

    // Filter by personal status
    const userAttempts = (attemptsMap.get(uid) || []).filter(a => !a.hiddenFromStats);
    const userFavorites = favoritesMap.get(uid) || new Map();

    const latestAttemptByQuestion = new Map<string, QuestionAttempt>();
    userAttempts.forEach((att) => {
      const existing = latestAttemptByQuestion.get(att.questionId);
      if (!existing || att.timestamp > existing.timestamp) {
        latestAttemptByQuestion.set(att.questionId, att);
      }
    });

    const attemptedIds = new Set(userAttempts.map((a) => a.questionId));
    const correctIds = new Set(userAttempts.filter((a) => a.isCorrect).map((a) => a.questionId));
    const wrongIds = new Set(userAttempts.filter((a) => !a.isCorrect).map((a) => a.questionId));

    if (filters.personalStatus === 'ineditas') {
      available = available.filter((q) => !attemptedIds.has(q.id));
    } else if (filters.personalStatus === 'acertadas') {
      available = available.filter((q) => correctIds.has(q.id));
    } else if (filters.personalStatus === 'erradas' || filters.personalStatus === 'caderno_erros') {
      const notebook = getUserErrorNotebook(uid);
      const activeErrorIds = new Set(notebook.items.filter((i) => i.status === 'ativo').map((i) => i.questionId));
      if (activeErrorIds.size > 0) {
        available = available.filter((q) => activeErrorIds.has(q.id));
      } else {
        available = available.filter((q) => wrongIds.has(q.id));
      }
    } else if (filters.personalStatus === 'favoritas') {
      available = available.filter((q) => userFavorites.get(q.id)?.bookmarked);
    } else if (filters.personalStatus === 'revisao') {
      available = available.filter((q) => userFavorites.get(q.id)?.needsReview);
    }

    // Fallback if filter yielded 0 questions: fallback to all available
    if (available.length === 0) {
      available = Array.from(questionsMap.values()).filter((q) => q.status !== 'desativada');
    }

    // Ordering
    if (filters.order === 'aleatoria' || !filters.order) {
      // 1. Generate or fetch base sequence for this caderno
      const seqKey = `seq_${uid}_${filters.volume || 'todas'}_${filters.caderno || 'todos'}`;
      
      if (filters.forceShuffle) {
        cadernoSequencesMap.delete(seqKey);
      }
      
      if (!cadernoSequencesMap.has(seqKey)) {
        // Generate a sequence of ALL questions for this caderno to ensure stability across topics
        let baseQuestions = Array.from(questionsMap.values()).filter((q) => q.status !== 'desativada');
        if (filters.volume && filters.volume !== 'todas') {
          baseQuestions = baseQuestions.filter((q) => q.volume === filters.volume);
        }
        if (filters.caderno && filters.caderno !== 'todos' && filters.caderno !== 'todas') {
          baseQuestions = baseQuestions.filter((q) => (q.caderno || 'Sem caderno') === filters.caderno);
        }
        // Shuffle base
        baseQuestions = [...baseQuestions].sort(() => Math.random() - 0.5);
        cadernoSequencesMap.set(seqKey, baseQuestions.map(q => q.id));
        saveDiskFile('caderno_sequences_db.json', Array.from(cadernoSequencesMap.entries()));
      }
      
      const sequence = cadernoSequencesMap.get(seqKey) || [];
      const orderMap = new Map(sequence.map((id, index) => [id, index]));
      
      available = [...available].sort((a, b) => {
        const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
        const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
        return idxA - idxB;
      });
    } else if (filters.order === 'recentes') {
      available = [...available].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (filters.order === 'antigas') {
      available = [...available].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } else if (filters.order === 'maior_taxa_erro') {
      const wrongCountMap: Record<string, number> = {};
      userAttempts.forEach((a) => {
        if (!a.isCorrect) {
          wrongCountMap[a.questionId] = (wrongCountMap[a.questionId] || 0) + 1;
        }
      });
      available = [...available].sort((a, b) => (wrongCountMap[b.id] || 0) - (wrongCountMap[a.id] || 0));
    }

    const count = filters?.count && filters.count > 0 ? Math.min(filters.count, available.length) : available.length;
    const selected = available.slice(0, count);

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const initialBookmarked: Record<string, boolean> = {};
    const initialNeedsReview: Record<string, boolean> = {};
    const initialAnswers: Record<string, any> = {};

    selected.forEach((q) => {
      const fav = userFavorites.get(q.id);
      if (fav?.bookmarked) initialBookmarked[q.id] = true;
      if (fav?.needsReview) initialNeedsReview[q.id] = true;

      const lastAtt = latestAttemptByQuestion.get(q.id);
      const isErrorNotebook = filters.personalStatus === 'caderno_erros';
      if (lastAtt && !isErrorNotebook) {
        initialAnswers[q.id] = {
          selectedAnswer: lastAtt.selectedAnswer,
          isCorrect: lastAtt.isCorrect,
          correctAnswer: q.answer,
          explanation: q.explanation,
          legalBasis: q.legalBasis,
          timestamp: lastAtt.timestamp,
          responseTimeSeconds: lastAtt.responseTimeSeconds || 0,
        };
      }
    });

    const sanitizedQuestions = selected.map((q) => {
      const sanitized = sanitizeQuestion(q);
      const lastAtt = latestAttemptByQuestion.get(q.id);
      const isErrorNotebook = filters.personalStatus === 'caderno_erros';
      if (lastAtt && !isErrorNotebook) {
        sanitized.userAnswer = lastAtt.selectedAnswer;
        sanitized.isCorrect = lastAtt.isCorrect;
        sanitized.answer = q.answer;
        sanitized.explanation = q.explanation;
        sanitized.legalBasis = q.legalBasis;
      }
      return sanitized;
    });

    const newSession: StudySession = {
      id: sessionId,
      userId: uid,
      mode: filters.mode || 'study',
      title:
        filters.mode === 'simulado'
          ? `Simulado Fiscal • ${selected.length} questões`
          : `Sessão de Estudos • ${filters.volume || 'Geral'}`,
      filters,
      questionIds: selected.map((q) => q.id),
      questions: sanitizedQuestions,
      currentIndex: 0,
      answers: initialAnswers,
      bookmarked: initialBookmarked,
      needsReview: initialNeedsReview,
      completed: false,
      startedAt: Date.now(),
      timeSpentSeconds: 0,
      timeLimitSeconds: filters.timeLimitMinutes ? filters.timeLimitMinutes * 60 : undefined,
    };

    await persistSession(newSession);
    res.json({ session: newSession });
  });

  // 5. Get Session
  app.get('/api/questions/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessionsMap.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }
    res.json({ session });
  });

  // 6. Submit Answer (Gabarito Seguro no servidor)
  // Sync Session State
  app.post("/api/questions/session/:sessionId/sync", (req, res) => {
    const { sessionId } = req.params;
    const { currentIndex, bookmarked, needsReview } = req.body;
    const session = sessionsMap.get(sessionId);
    if (session) {
      if (currentIndex !== undefined) session.currentIndex = currentIndex;
      if (bookmarked !== undefined) session.bookmarked = bookmarked;
      if (needsReview !== undefined) session.needsReview = needsReview;
      persistSession(session);
      return res.json({ success: true });
    }
    res.status(404).json({ error: "Sessão não encontrada" });
  });

  app.post('/api/questions/submit-answer', async (req, res) => {
    const { sessionId, questionId, questionVersion, selectedAnswer, responseTimeSeconds, mode, userId } =
      req.body;

    const question = questionsMap.get(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    const uid = userId || 'demo-user';
    const isCorrect = question.answer === selectedAnswer;

    // Record attempt
    const attempt: QuestionAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: uid,
      questionId,
      questionVersion: questionVersion || question.version,
      selectedAnswer,
      isCorrect,
      mode: mode || 'study',
      sessionId,
      timestamp: Date.now(),
      responseTimeSeconds: responseTimeSeconds || 0,
      volume: question.volume,
      topic: question.topic,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      type: question.type,
    };

    await persistAttempt(attempt);

    // Update session state if session is provided
    let session = sessionsMap.get(sessionId);
    if (session) {
      if (mode === 'study') {
        session.answers[questionId] = {
          selectedAnswer,
          isCorrect,
          correctAnswer: question.answer,
          explanation: question.explanation,
          legalBasis: question.legalBasis,
          timestamp: Date.now(),
          responseTimeSeconds: responseTimeSeconds || 0,
        };

        const qIndex = session.questions.findIndex((q) => q.id === questionId);
        if (qIndex !== -1) {
          session.questions[qIndex].userAnswer = selectedAnswer;
          session.questions[qIndex].isCorrect = isCorrect;
          session.questions[qIndex].answer = question.answer;
          session.questions[qIndex].explanation = question.explanation;
          session.questions[qIndex].legalBasis = question.legalBasis;
        }
      } else {
        session.answers[questionId] = {
          selectedAnswer,
          timestamp: Date.now(),
          responseTimeSeconds: responseTimeSeconds || 0,
        };
        const qIndex = session.questions.findIndex((q) => q.id === questionId);
        if (qIndex !== -1) {
          session.questions[qIndex].userAnswer = selectedAnswer;
        }
      }
      await persistSession(session);
    }

    if (mode === 'study') {
      res.json({
        isCorrect,
        correctAnswer: question.answer,
        explanation: question.explanation,
        legalBasis: question.legalBasis,
      });
    } else {
      res.json({
        recorded: true,
        selectedAnswer,
      });
    }
  });

  // 7. Finish Session / Simulado & Calculate Final Stats
  app.post('/api/questions/session/:sessionId/finish', async (req, res) => {
    const { sessionId } = req.params;
    const { timeSpentSeconds } = req.body;
    const session = sessionsMap.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    session.completed = true;
    session.completedAt = Date.now();
    if (timeSpentSeconds !== undefined) {
      session.timeSpentSeconds = timeSpentSeconds;
    }

    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;
    const topicBreakdown: Record<string, { total: number; correct: number; wrong: number; percentage: number }> =
      {};
    const difficultyBreakdown: Record<string, { total: number; correct: number; wrong: number }> = {
      facil: { total: 0, correct: 0, wrong: 0 },
      media: { total: 0, correct: 0, wrong: 0 },
      dificil: { total: 0, correct: 0, wrong: 0 },
    };

    session.questions.forEach((sanitized) => {
      const fullQ = questionsMap.get(sanitized.id);
      if (!fullQ) return;

      const userAnsState = session.answers[sanitized.id];
      const answered = !!userAnsState?.selectedAnswer;

      if (!topicBreakdown[fullQ.topic]) {
        topicBreakdown[fullQ.topic] = { total: 0, correct: 0, wrong: 0, percentage: 0 };
      }
      topicBreakdown[fullQ.topic].total++;

      if (difficultyBreakdown[fullQ.difficulty]) {
        difficultyBreakdown[fullQ.difficulty].total++;
      }

      if (!answered) {
        blankCount++;
      } else {
        const isCorrect = userAnsState.selectedAnswer === fullQ.answer;
        userAnsState.isCorrect = isCorrect;
        userAnsState.correctAnswer = fullQ.answer;
        userAnsState.explanation = fullQ.explanation;
        userAnsState.legalBasis = fullQ.legalBasis;

        sanitized.userAnswer = userAnsState.selectedAnswer;
        sanitized.isCorrect = isCorrect;

        if (isCorrect) {
          correctCount++;
          topicBreakdown[fullQ.topic].correct++;
          if (difficultyBreakdown[fullQ.difficulty]) {
            difficultyBreakdown[fullQ.difficulty].correct++;
          }
        } else {
          wrongCount++;
          topicBreakdown[fullQ.topic].wrong++;
          if (difficultyBreakdown[fullQ.difficulty]) {
            difficultyBreakdown[fullQ.difficulty].wrong++;
          }
        }
      }

      sanitized.answer = fullQ.answer;
      sanitized.explanation = fullQ.explanation;
      sanitized.legalBasis = fullQ.legalBasis;
    });

    Object.values(topicBreakdown).forEach((tb) => {
      tb.percentage = tb.total > 0 ? Math.round((tb.correct / tb.total) * 100) : 0;
    });

    const total = session.questions.length;
    const answered = correctCount + wrongCount;
    const percentage = answered > 0 ? Math.round((correctCount / total) * 100) : 0;

    session.stats = {
      total,
      answered,
      correct: correctCount,
      wrong: wrongCount,
      blank: blankCount,
      percentage,
      timeSpentSeconds: session.timeSpentSeconds,
      topicBreakdown,
      difficultyBreakdown,
    };

    await persistSession(session);
    res.json({ session });
  });

  // 8. Toggle Bookmark / Needs Review
  app.post('/api/questions/favorite', async (req, res) => {
    const { userId, questionId, bookmarked, needsReview, notes } = req.body;
    const uid = userId || 'demo-user';

    let userFavs = favoritesMap.get(uid);
    if (!userFavs) {
      userFavs = new Map<string, UserFavorite>();
      favoritesMap.set(uid, userFavs);
    }

    let existing = userFavs.get(questionId);
    if (!existing) {
      existing = {
        questionId,
        bookmarked: !!bookmarked,
        needsReview: !!needsReview,
        notes: notes || '',
        updatedAt: Date.now(),
      };
    } else {
      if (bookmarked !== undefined) existing.bookmarked = bookmarked;
      if (needsReview !== undefined) existing.needsReview = needsReview;
      if (notes !== undefined) existing.notes = notes;
      existing.updatedAt = Date.now();
    }

    await persistFavorite(uid, existing);
    res.json({ favorite: existing });
  });

  // 9. Get User Favorites & Review list
  app.get('/api/user/favorites', (req, res) => {
    const uid = (req.query.userId as string) || 'demo-user';
    const userFavs = favoritesMap.get(uid);
    const list: Array<{ favorite: UserFavorite; question: SanitizedQuestion }> = [];

    if (userFavs) {
      userFavs.forEach((fav, qId) => {
        if (fav.bookmarked || fav.needsReview) {
          const q = questionsMap.get(qId);
          if (q) {
            list.push({
              favorite: fav,
              question: sanitizeQuestion(q),
            });
          }
        }
      });
    }

    res.json({ favorites: list });
  });

  // 9.1. Get Caderno de Erros
  app.get('/api/user/error-notebook', (req, res) => {
    const uid = (req.query.userId as string) || 'demo-user';
    const notebook = getUserErrorNotebook(uid);
    res.json(notebook);
  });

  // 9.2. Update Caderno de Erros Note
  app.post('/api/user/error-notebook/notes', async (req, res) => {
    const { userId, questionId, userNotes } = req.body || {};
    if (!userId || !questionId) {
      return res.status(400).json({ error: 'userId e questionId são obrigatórios' });
    }

    const userMap = errorNotebookMap.get(userId) || new Map();
    const existing = userMap.get(questionId) || { questionId, updatedAt: Date.now() };
    const updated: ErrorNotebookMeta = {
      ...existing,
      questionId,
      userNotes: userNotes || '',
      updatedAt: Date.now(),
    };

    await persistErrorNotebookMeta(userId, questionId, updated);
    res.json({ success: true, item: updated });
  });

  // 9.3. Toggle / Update Caderno de Erros Status
  app.post('/api/user/error-notebook/status', async (req, res) => {
    const { userId, questionId, status } = req.body || {};
    if (!userId || !questionId || !status) {
      return res.status(400).json({ error: 'userId, questionId e status são obrigatórios' });
    }

    const userMap = errorNotebookMap.get(userId) || new Map();
    const existing = userMap.get(questionId) || { questionId, updatedAt: Date.now() };
    const updated: ErrorNotebookMeta = {
      ...existing,
      questionId,
      status: status === 'superado' ? 'superado' : 'ativo',
      updatedAt: Date.now(),
    };

    await persistErrorNotebookMeta(userId, questionId, updated);
    res.json({ success: true, item: updated });
  });

  // 10. User Performance & Statistics
  // 10. Get Question History
  app.get('/api/questions/:questionId/history', (req, res) => {
    const uid = (req.query.userId as string) || 'demo-user';
    const qId = req.params.questionId;
    const userAttempts = attemptsMap.get(uid) || [];
    // Return all attempts for this question, sorted by timestamp descending
    const qAttempts = userAttempts.filter(a => a.questionId === qId).sort((a, b) => b.timestamp - a.timestamp);
    res.json({ attempts: qAttempts });
  });

  app.get('/api/user/stats', (req, res) => {
    const uid = (req.query.userId as string) || 'demo-user';
    const userAttempts = (attemptsMap.get(uid) || []).filter(a => !a.hiddenFromStats);

    const uniqueQuestionsMap = new Map<string, QuestionAttempt[]>();
    userAttempts.forEach((att) => {
      if (!uniqueQuestionsMap.has(att.questionId)) {
        uniqueQuestionsMap.set(att.questionId, []);
      }
      uniqueQuestionsMap.get(att.questionId)!.push(att);
    });

    const uniqueCount = uniqueQuestionsMap.size;
    const totalAttempts = userAttempts.length;
    const totalCorrect = userAttempts.filter((a) => a.isCorrect).length;
    const totalWrong = totalAttempts - totalCorrect;
    const globalAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    let firstAttemptsCorrect = 0;
    let latestAttemptsCorrect = 0;

    uniqueQuestionsMap.forEach((attempts) => {
      const sorted = [...attempts].sort((a, b) => a.timestamp - b.timestamp);
      if (sorted[0]?.isCorrect) firstAttemptsCorrect++;
      if (sorted[sorted.length - 1]?.isCorrect) latestAttemptsCorrect++;
    });

    const firstAttemptAccuracy = uniqueCount > 0 ? Math.round((firstAttemptsCorrect / uniqueCount) * 100) : 0;
    const recentAttemptAccuracy = uniqueCount > 0 ? Math.round((latestAttemptsCorrect / uniqueCount) * 100) : 0;

    const volumeStats: Record<string, { total: number; answered: number; correct: number; accuracy: number }> = {};
    const cadernoStats: Record<string, { total: number; answered: number; correct: number; accuracy: number }> = {};
    const topicStats: Record<string, { total: number; answered: number; correct: number; accuracy: number }> = {};
    const difficultyStats: Record<string, { total: number; answered: number; correct: number; accuracy: number }> = {
      facil: { total: 0, answered: 0, correct: 0, accuracy: 0 },
      media: { total: 0, answered: 0, correct: 0, accuracy: 0 },
      dificil: { total: 0, answered: 0, correct: 0, accuracy: 0 },
    };
    const typeStats: Record<string, { total: number; answered: number; correct: number; accuracy: number }> = {
      lei_seca: { total: 0, answered: 0, correct: 0, accuracy: 0 },
      conceitual: { total: 0, answered: 0, correct: 0, accuracy: 0 },
      caso_pratico: { total: 0, answered: 0, correct: 0, accuracy: 0 },
      integracao: { total: 0, answered: 0, correct: 0, accuracy: 0 },
      prazo_numero: { total: 0, answered: 0, correct: 0, accuracy: 0 },
      assertivas: { total: 0, answered: 0, correct: 0, accuracy: 0 },
    };

    questionsMap.forEach((q) => {
      if (q.status === 'desativada') return;
      if (!volumeStats[q.volume]) {
        volumeStats[q.volume] = { total: 0, answered: 0, correct: 0, accuracy: 0 };
      }
      volumeStats[q.volume].total++;

      const cadKey = q.caderno || 'Sem caderno';
      if (!cadernoStats[cadKey]) {
        cadernoStats[cadKey] = { total: 0, answered: 0, correct: 0, accuracy: 0 };
      }
      cadernoStats[cadKey].total++;

      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { total: 0, answered: 0, correct: 0, accuracy: 0 };
      }
      topicStats[q.topic].total++;

      if (difficultyStats[q.difficulty]) {
        difficultyStats[q.difficulty].total++;
      }
      if (typeStats[q.type]) {
        typeStats[q.type].total++;
      }
    });

    userAttempts.forEach((a) => {
      if (volumeStats[a.volume]) {
        volumeStats[a.volume].answered++;
        if (a.isCorrect) volumeStats[a.volume].correct++;
      }
      const cadKey = a.caderno || 'Sem caderno';
      if (cadernoStats[cadKey]) {
        cadernoStats[cadKey].answered++;
        if (a.isCorrect) cadernoStats[cadKey].correct++;
      }
      if (topicStats[a.topic]) {
        topicStats[a.topic].answered++;
        if (a.isCorrect) topicStats[a.topic].correct++;
      }
      if (difficultyStats[a.difficulty]) {
        difficultyStats[a.difficulty].answered++;
        if (a.isCorrect) difficultyStats[a.difficulty].correct++;
      }
      if (typeStats[a.type]) {
        typeStats[a.type].answered++;
        if (a.isCorrect) typeStats[a.type].correct++;
      }
    });

    const calculateAcc = (obj: Record<string, { answered: number; correct: number; accuracy: number }>) => {
      Object.values(obj).forEach((item) => {
        item.accuracy = item.answered > 0 ? Math.round((item.correct / item.answered) * 100) : 0;
      });
    };
    calculateAcc(volumeStats);
    calculateAcc(cadernoStats);
    calculateAcc(topicStats);
    calculateAcc(difficultyStats);
    calculateAcc(typeStats);

    const stats: GlobalUserStats = {
      totalAttempts,
      uniqueQuestionsAnswered: uniqueCount,
      totalCorrect,
      totalWrong,
      globalAccuracy,
      firstAttemptAccuracy,
      recentAttemptAccuracy,
      volumeStats,
      cadernoStats,
      topicStats,
      difficultyStats: difficultyStats as any,
      typeStats: typeStats as any,
      evolutionData: [],
      mostMissedQuestions: [],
    };

    res.json({ stats });
  });

  // 10.1 Reset User Performance & Statistics
  app.post('/api/user/reset-stats', async (req, res) => {
    const { userId, volume, caderno } = req.body || {};
    const uid = userId || 'demo-user';

    let userAttempts = attemptsMap.get(uid) || [];
    let firestoreDocsToHide: string[] = [];
    
    let isGlobal = (!volume || volume === 'todas') && (!caderno || caderno === 'todos' || caderno === 'todas');

    if (isGlobal) {
      userAttempts.forEach((a) => (a.hiddenFromStats = true));
    } else {
      userAttempts.forEach((a) => {
        const matchesVolume = !volume || volume === 'todas' || a.volume === volume;
        const matchesCaderno = !caderno || caderno === 'todos' || caderno === 'todas' || (a.caderno || 'Sem caderno') === caderno;
        if (matchesVolume && matchesCaderno) {
          a.hiddenFromStats = true;
          firestoreDocsToHide.push(a.id);
        }
      });
    }

    attemptsMap.set(uid, userAttempts);
    saveDiskFile('attempts_db.json', Array.from(attemptsMap.entries()));
    
    // Reset sequence for this specific caderno or all if global
    if (isGlobal) {
       for (const key of cadernoSequencesMap.keys()) {
         if (key.startsWith(`seq_${uid}_`)) {
           cadernoSequencesMap.delete(key);
         }
       }
    } else {
       const seqKey = `seq_${uid}_${volume || 'todas'}_${caderno || 'todos'}`;
       cadernoSequencesMap.delete(seqKey);
    }
    saveDiskFile('caderno_sequences_db.json', Array.from(cadernoSequencesMap.entries()));

    // 2. Clear firestore attempts if available
    if (firestoreDb) {
      try {
        const snap = await getDocs(collection(firestoreDb, 'users', uid, 'attempts'));
        const batchOps = snap.docs.map((d) => {
          const data = d.data();
          if (isGlobal || firestoreDocsToHide.includes(d.id)) {
            if (data.isCorrect) {
              return deleteDoc(d.ref);
            } else {
              return setDoc(d.ref, { ...data, hiddenFromStats: true }, { merge: true });
            }
          }
          return null;
        }).filter(Boolean);
        await Promise.all(batchOps);
      } catch (e) {
        console.warn(`Firestore error clearing attempts for user ${uid}:`, e);
      }
    }

    // 3. Reset active study sessions for this user matching the filters
    sessionsMap.forEach((session) => {
      if (session.userId === uid) {
         let matchesSession = isGlobal;
         if (!isGlobal) {
            const matchesVolume = !volume || volume === 'todas' || session.filters?.volume === volume;
            const matchesCaderno = !caderno || caderno === 'todos' || caderno === 'todas' || session.filters?.caderno === caderno;
            matchesSession = matchesVolume && matchesCaderno;
         }
         
         if (matchesSession) {
            session.answers = {};
            session.completed = false;
            session.currentIndex = 0;
            if (session.questions) {
              session.questions.forEach((q) => {
                q.userAnswer = undefined;
                q.isCorrect = undefined;
              });
            }
         }
      }
    });
    saveDiskFile('sessions_db.json', Array.from(sessionsMap.values()));

    return res.json({ success: true, message: 'Desempenho zerado com sucesso.' });
  });

  // 11. Report Question
  app.post('/api/questions/report', (req, res) => {
    const { questionId, questionVersion, reason, details, userId } = req.body;
    if (!questionId || !reason) {
      return res.status(400).json({ error: 'Question ID e motivo são obrigatórios' });
    }

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const report: QuestionReport = {
      id: reportId,
      questionId,
      questionVersion: questionVersion || 1,
      userId: userId || 'demo-user',
      reason,
      details: details || '',
      status: 'pendente',
      createdAt: Date.now(),
    };

    reportsMap.set(reportId, report);
    saveDiskFile('reports_db.json', Array.from(reportsMap.values()));
    res.json({ success: true, report });
  });

  // 12. List Questions (Admin View)
  app.get('/api/admin/questions', (req, res) => {
    const { search, volume, caderno, topic, difficulty, type, status, page = 1, limit = 50 } = req.query;
    let list = Array.from(questionsMap.values());

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.statement.toLowerCase().includes(q) ||
          item.explanation?.toLowerCase().includes(q) ||
          item.legalBasis?.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          item.volume.toLowerCase().includes(q) ||
          item.caderno?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (volume && volume !== 'todas') {
      list = list.filter((item) => item.volume === volume);
    }
    if (caderno && caderno !== 'todos' && caderno !== 'todas') {
      list = list.filter((item) => (item.caderno || 'Sem caderno') === caderno);
    }
    if (topic && topic !== 'todos') {
      list = list.filter((item) => item.topic === topic);
    }
    if (difficulty && difficulty !== 'todas') {
      list = list.filter((item) => item.difficulty === difficulty);
    }
    if (type && type !== 'todas') {
      list = list.filter((item) => item.type === type);
    }
    if (status && status !== 'todos') {
      list = list.filter((item) => item.status === status);
    }

    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    const p = Math.max(1, parseInt(String(page)));
    const l = Math.max(1, parseInt(String(limit)));
    const total = list.length;
    const paginated = list.slice((p - 1) * l, p * l);

    res.json({
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      questions: paginated,
    });
  });

  // 13. Create Question (Admin)
  app.post('/api/admin/questions', async (req, res) => {
    const data = req.body;
    if (!data.id || !data.statement || !data.options || !data.answer) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    if (questionsMap.has(data.id)) {
      return res.status(409).json({ error: `Questão com ID "${data.id}" já existe` });
    }

    const newQuestion: Question = {
      ...data,
      version: 1,
      status: data.status || 'revisada',
      tags: data.tags || [],
      isCustom: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await persistQuestion(newQuestion);

    const versionSnap: QuestionVersionSnapshot = {
      versionId: `${newQuestion.id}_v1`,
      questionId: newQuestion.id,
      version: 1,
      dataSnapshot: { ...newQuestion },
      timestamp: Date.now(),
      changedBy: 'Admin',
      changeNote: 'Criação inicial da questão',
    };
    await persistVersionSnapshot(versionSnap);

    res.json({ question: newQuestion, totalQuestions: questionsMap.size });
  });

  // 14. Update Question (Admin)
  app.put('/api/admin/questions/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const existing = questionsMap.get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    const snap: QuestionVersionSnapshot = {
      versionId: `${existing.id}_v${existing.version}`,
      questionId: existing.id,
      version: existing.version,
      dataSnapshot: { ...existing },
      timestamp: existing.updatedAt || Date.now(),
      changedBy: data.changedBy || 'Admin',
      changeNote: data.changeNote || 'Edição administrativa de conteúdo',
    };
    await persistVersionSnapshot(snap);

    const updated: Question = {
      ...existing,
      ...data,
      id,
      version: existing.version + 1,
      updatedAt: Date.now(),
    };

    await persistQuestion(updated);
    res.json({ question: updated });
  });

  // 15. Change Status (Admin)
  app.patch('/api/admin/questions/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const existing = questionsMap.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    existing.status = status;
    existing.updatedAt = Date.now();
    await persistQuestion(existing);
    res.json({ question: existing });
  });

  // 16. Duplicate Question (Admin)
  app.post('/api/admin/questions/:id/duplicate', async (req, res) => {
    const { id } = req.params;
    const existing = questionsMap.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    const newId = `${id}-copia-${Date.now().toString().slice(-4)}`;
    const duplicated: Question = {
      ...existing,
      id: newId,
      version: 1,
      status: 'rascunho',
      statement: `[CÓPIA] ${existing.statement}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await persistQuestion(duplicated);
    res.json({ question: duplicated });
  });

  // 17. Get Question Version History (Admin)
  app.get('/api/admin/questions/:id/versions', (req, res) => {
    const { id } = req.params;
    const versions = questionVersionsMap.get(id) || [];
    const current = questionsMap.get(id);
    res.json({ versions, current });
  });

  // 17.1. Delete Single Question (Admin)
  app.delete('/api/admin/questions/:id', async (req, res) => {
    const { id } = req.params;
    const existing = questionsMap.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    await removeQuestion(id);

    sessionsMap.forEach((session) => {
      session.questions = session.questions.filter((q) => q.id !== id);
      if (session.answers) delete session.answers[id];
      if (session.bookmarked) delete session.bookmarked[id];
      if (session.needsReview) delete session.needsReview[id];
      if (session.currentIndex >= session.questions.length) {
        session.currentIndex = Math.max(0, session.questions.length - 1);
      }
    });

    favoritesMap.forEach((userFavs) => {
      userFavs.delete(id);
    });

    res.json({
      success: true,
      deletedId: id,
      message: `Questão "${id}" excluída com sucesso`,
      totalQuestions: questionsMap.size,
    });
  });

  // 17.2. Bulk Delete Questions (Admin)
  app.post('/api/admin/questions/bulk-delete', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Nenhum ID informado para exclusão' });
    }

    const idsSet = new Set(ids);
    let deletedCount = 0;

    for (const id of ids) {
      if (questionsMap.has(id)) {
        await removeQuestion(id);
        deletedCount++;
      }
    }

    sessionsMap.forEach((session) => {
      session.questions = session.questions.filter((q) => !idsSet.has(q.id));
      ids.forEach((id) => {
        if (session.answers) delete session.answers[id];
        if (session.bookmarked) delete session.bookmarked[id];
        if (session.needsReview) delete session.needsReview[id];
      });
      if (session.currentIndex >= session.questions.length) {
        session.currentIndex = Math.max(0, session.questions.length - 1);
      }
    });

    favoritesMap.forEach((userFavs) => {
      ids.forEach((id) => userFavs.delete(id));
    });

    res.json({
      success: true,
      deletedCount,
      message: `${deletedCount} questões excluídas com sucesso`,
      totalQuestions: questionsMap.size,
    });
  });

  // 17.3. Delete All Added / Custom Questions (Admin)
  app.post('/api/admin/questions/delete-added', async (req, res) => {
    const toDelete: string[] = [];

    questionsMap.forEach((q, id) => {
      if (q.isCustom || !SEED_QUESTION_IDS.has(id)) {
        toDelete.push(id);
      }
    });

    const idsSet = new Set(toDelete);
    for (const id of toDelete) {
      await removeQuestion(id);
    }

    importsMap.clear();
    saveDiskFile('imports_db.json', []);

    sessionsMap.forEach((session) => {
      session.questions = session.questions.filter((q) => !idsSet.has(q.id));
      toDelete.forEach((id) => {
        if (session.answers) delete session.answers[id];
        if (session.bookmarked) delete session.bookmarked[id];
        if (session.needsReview) delete session.needsReview[id];
      });
      if (session.currentIndex >= session.questions.length) {
        session.currentIndex = Math.max(0, session.questions.length - 1);
      }
    });

    favoritesMap.forEach((userFavs) => {
      toDelete.forEach((id) => userFavs.delete(id));
    });

    res.json({
      success: true,
      deletedCount: toDelete.length,
      remainingCount: questionsMap.size,
      message: `${toDelete.length} questões adicionadas foram excluídas com sucesso.`,
    });
  });

  // 17.5. Delete Questions by Discipline / Caderno / Topic (Admin)
  app.post('/api/admin/questions/delete-by-discipline', async (req, res) => {
    const { volume, caderno, topic } = req.body || {};
    if (!volume) {
      return res.status(400).json({ error: 'Nome da disciplina/volume é obrigatório' });
    }

    const targetVol = String(volume).trim().toLowerCase();
    const targetCad = caderno ? String(caderno).trim().toLowerCase() : null;
    const targetTop = topic ? String(topic).trim().toLowerCase() : null;

    const toDelete: string[] = [];
    questionsMap.forEach((q, id) => {
      const qVol = String(q.volume || 'Conhecimentos Gerais').trim().toLowerCase();
      const qCad = String(q.caderno || 'Sem caderno').trim().toLowerCase();
      const qTop = String(q.topic || 'Geral').trim().toLowerCase();

      const volMatch = qVol === targetVol || (q.volume && String(q.volume).trim().toLowerCase() === targetVol);
      const cadMatch = !targetCad || targetCad === 'todos' || targetCad === 'todas' || qCad === targetCad;
      const topMatch = !targetTop || targetTop === 'todos' || qTop === targetTop;

      if (volMatch && cadMatch && topMatch) {
        toDelete.push(id);
      }
    });

    const idsSet = new Set(toDelete);
    for (const id of toDelete) {
      await removeQuestion(id);
    }

    sessionsMap.forEach((session) => {
      session.questions = session.questions.filter((q) => !idsSet.has(q.id));
      toDelete.forEach((id) => {
        if (session.answers) delete session.answers[id];
        if (session.bookmarked) delete session.bookmarked[id];
        if (session.needsReview) delete session.needsReview[id];
      });
      if (session.currentIndex >= session.questions.length) {
        session.currentIndex = Math.max(0, session.questions.length - 1);
      }
    });

    favoritesMap.forEach((userFavs) => {
      toDelete.forEach((id) => userFavs.delete(id));
    });

    res.json({
      success: true,
      deletedCount: toDelete.length,
      message: `${toDelete.length} questões da disciplina "${volume}" foram excluídas com sucesso.`,
      totalQuestions: questionsMap.size,
    });
  });

  // 17.4. Reset Questions Database (Admin)
  app.post('/api/admin/questions/reset-all', async (req, res) => {
    const currentKeys = Array.from(questionsMap.keys());
    for (const k of currentKeys) {
      await removeQuestion(k);
    }
    questionVersionsMap.clear();
    importsMap.clear();

    saveDiskFile('questions_db.json', []);
    saveDiskFile('imports_db.json', []);

    res.json({
      success: true,
      totalQuestions: 0,
      message: `Banco de questões limpo com sucesso.`,
    });
  });

  // 18. Validate JSON Import (Admin)
  app.post('/api/admin/import/validate', (req, res) => {
    const rawQuestions = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.questions)
      ? req.body.questions
      : null;

    if (!rawQuestions) {
      return res.status(400).json({ error: 'Formato inválido: esperado um array de questões ou objeto { questions: [...] }' });
    }

    const previewItems: ImportPreviewItem[] = [];
    let newCount = 0;
    let updateCount = 0;
    let ignoreCount = 0;
    let errorCount = 0;

    const validNormalizedList: Question[] = [];
    const disciplinesSet = new Set<string>();
    const cadernosSet = new Set<string>();
    const topicsSet = new Set<string>();
    const subtopicsSet = new Set<string>();
    let semCadernoCount = 0;

    rawQuestions.forEach((raw) => {
      const validation = validateOfficialQuestion(raw);
      if (!validation.valid) {
        errorCount++;
        previewItems.push({
          classification: 'ERRO',
          question: raw,
          reason: 'Campos obrigatórios ausentes ou inválidos',
          errors: validation.errors,
        });
        return;
      }

      const incoming = normalizeImportQuestion(raw);
      validNormalizedList.push(incoming);
      const singleWarnings = auditSingleQuestion(incoming);

      if (incoming.volume) disciplinesSet.add(incoming.volume);
      if (incoming.caderno && incoming.caderno !== 'Sem caderno') {
        cadernosSet.add(incoming.caderno);
      } else {
        semCadernoCount++;
      }
      if (incoming.topic) topicsSet.add(incoming.topic);
      if (incoming.subtopic) subtopicsSet.add(incoming.subtopic);

      const existing = questionsMap.get(incoming.id);

      if (!existing) {
        newCount++;
        previewItems.push({
          classification: 'NOVA',
          question: incoming,
          reason: 'Questão inédita que será inserida no banco',
          auditWarnings: singleWarnings,
        });
      } else {
        const incomingVersion = incoming.version || 1;
        const existingVersion = existing.version || 1;

        if (incomingVersion > existingVersion) {
          updateCount++;
          previewItems.push({
            classification: 'ATUALIZACAO',
            question: incoming,
            existingQuestion: existing,
            reason: `Nova versão detectada (v${incomingVersion} > v${existingVersion}). Atualizará os dados.`,
            auditWarnings: singleWarnings,
          });
        } else if (incomingVersion === existingVersion) {
          const isIdentical =
            incoming.statement.trim() === existing.statement.trim() &&
            incoming.answer === existing.answer &&
            incoming.explanation?.trim() === existing.explanation?.trim() &&
            incoming.legalBasis?.trim() === existing.legalBasis?.trim();

          if (isIdentical) {
            ignoreCount++;
            previewItems.push({
              classification: 'IGUAL',
              question: incoming,
              existingQuestion: existing,
              reason: `Idêntica à questão v${existingVersion} no banco. Será ignorada.`,
              auditWarnings: singleWarnings,
            });
          } else {
            updateCount++;
            previewItems.push({
              classification: 'ATUALIZACAO',
              question: incoming,
              existingQuestion: existing,
              reason: `Modificação detectada com mesma versão (v${incomingVersion}). Será incrementada para v${existingVersion + 1}.`,
              auditWarnings: singleWarnings,
            });
          }
        } else {
          errorCount++;
          previewItems.push({
            classification: 'ERRO',
            question: incoming,
            existingQuestion: existing,
            reason: `Rejeitada: versão no JSON (v${incomingVersion}) é inferior à versão atual no banco (v${existingVersion}).`,
            auditWarnings: singleWarnings,
          });
        }
      }
    });

    const batchQualityWarnings = auditBatchQuality(validNormalizedList);

    res.json({
      summary: {
        total: rawQuestions.length,
        nova: newCount,
        atualizacao: updateCount,
        igual: ignoreCount,
        erro: errorCount,
        disciplinesCount: disciplinesSet.size,
        disciplinesList: Array.from(disciplinesSet),
        cadernosCount: cadernosSet.size,
        cadernosList: Array.from(cadernosSet),
        topicsCount: topicsSet.size,
        subtopicsCount: subtopicsSet.size,
        semCadernoCount,
        canImport: errorCount === 0 || newCount + updateCount > 0,
      },
      batchQualityWarnings,
      items: previewItems,
    });
  });

  // 19. Execute JSON Import (Admin)
  app.post('/api/admin/import/execute', async (req, res) => {
    const rawBody = req.body;
    const questions = Array.isArray(rawBody)
      ? rawBody
      : Array.isArray(rawBody?.questions)
      ? rawBody.questions
      : null;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Array de questões ausente' });
    }

    const { schemaVersion, dataset, userEmail } = rawBody;

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let inserted = 0;
    let updated = 0;
    let ignored = 0;
    let errored = 0;
    const errors: string[] = [];
    const warnings: string[] = [];
    const questionIds: string[] = [];
    const batchQuestionsToPersist: Question[] = [];

    const disciplinesSet = new Set<string>();
    const cadernosSet = new Set<string>();
    const topicsSet = new Set<string>();
    const subtopicsSet = new Set<string>();
    let semCadernoCount = 0;

    for (const rawItem of questions) {
      try {
        const incoming = normalizeImportQuestion(rawItem);
        if (incoming.volume) disciplinesSet.add(incoming.volume);
        if (incoming.caderno && incoming.caderno !== 'Sem caderno') {
          cadernosSet.add(incoming.caderno);
        } else {
          semCadernoCount++;
        }
        if (incoming.topic) topicsSet.add(incoming.topic);
        if (incoming.subtopic) subtopicsSet.add(incoming.subtopic);

        const existing = questionsMap.get(incoming.id);

        if (!existing) {
          const newQ: Question = {
            ...incoming,
            version: incoming.version || 1,
            status: incoming.status || 'revisada',
            isCustom: !SEED_QUESTION_IDS.has(incoming.id),
            batchId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          batchQuestionsToPersist.push(newQ);
          questionIds.push(newQ.id);

          const snap: QuestionVersionSnapshot = {
            versionId: `${newQ.id}_v${newQ.version}`,
            questionId: newQ.id,
            version: newQ.version,
            dataSnapshot: { ...newQ },
            timestamp: Date.now(),
            changedBy: userEmail || 'Importador Oficial JSON',
            changeNote: `Importado no lote ${dataset?.name || batchId}`,
          };
          await persistVersionSnapshot(snap);
          inserted++;
        } else {
          const inV = incoming.version || existing.version + 1;
          const exV = existing.version || 1;

          const snap: QuestionVersionSnapshot = {
            versionId: `${existing.id}_v${existing.version}`,
            questionId: existing.id,
            version: existing.version,
            dataSnapshot: { ...existing },
            timestamp: existing.updatedAt || Date.now(),
            changedBy: userEmail || 'Importador Oficial JSON',
            changeNote: `Atualização de lote para v${Math.max(inV, exV + 1)}`,
          };
          await persistVersionSnapshot(snap);

          const finalVersion = Math.max(inV, exV + 1);
          const updatedQ: Question = {
            ...incoming,
            version: finalVersion,
            batchId,
            updatedAt: Date.now(),
          };
          batchQuestionsToPersist.push(updatedQ);
          questionIds.push(incoming.id);
          updated++;
        }
      } catch (err: any) {
        errored++;
        errors.push(`Questão ${rawItem?.id || 'sem-id'}: erro de processamento - ${err.message}`);
      }
    }

    if (batchQuestionsToPersist.length > 0) {
      await persistQuestionsBatch(batchQuestionsToPersist);
    }

    const batchSummary: ImportBatchSummary = {
      id: batchId,
      batchId,
      schemaVersion: schemaVersion || '1.0',
      datasetName: dataset?.name || 'Importação Manual JSON',
      importedBy: userEmail || 'Admin',
      timestamp: Date.now(),
      totalQuestions: questions.length,
      totalProcessed: questions.length,
      insertedCount: inserted,
      createdCount: inserted,
      updatedCount: updated,
      ignoredCount: ignored,
      skippedCount: ignored,
      errorCount: errored,
      errors,
      warnings,
      questionIds,
    };

    await persistImportBatch(batchSummary);

    res.json({
      success: true,
      batchSummary,
      totalDatabaseQuestions: questionsMap.size,
    });
  });

  // 20. List Import Batches (Admin)
  app.get('/api/admin/imports', (req, res) => {
    const list = Array.from(importsMap.values()).sort((a, b) => b.timestamp - a.timestamp);
    res.json({ imports: list });
  });

  // 20.1. Delete Import Batch and its Questions (Admin)
  app.delete('/api/admin/imports/:batchId', async (req, res) => {
    const { batchId } = req.params;
    const batch = importsMap.get(batchId);

    const questionIdsToDelete: string[] = [];

    questionsMap.forEach((q, id) => {
      if (q.batchId === batchId || (batch?.questionIds && batch.questionIds.includes(id))) {
        questionIdsToDelete.push(id);
      }
    });

    const idsSet = new Set(questionIdsToDelete);
    for (const id of questionIdsToDelete) {
      await removeQuestion(id);
    }

    await removeImportBatch(batchId);

    sessionsMap.forEach((session) => {
      session.questions = session.questions.filter((q) => !idsSet.has(q.id));
      questionIdsToDelete.forEach((id) => {
        if (session.answers) delete session.answers[id];
        if (session.bookmarked) delete session.bookmarked[id];
        if (session.needsReview) delete session.needsReview[id];
      });
      if (session.currentIndex >= session.questions.length) {
        session.currentIndex = Math.max(0, session.questions.length - 1);
      }
    });

    favoritesMap.forEach((userFavs) => {
      questionIdsToDelete.forEach((id) => userFavs.delete(id));
    });

    res.json({
      success: true,
      deletedCount: questionIdsToDelete.length,
      batchId,
      message: `Lote ${batchId} e suas ${questionIdsToDelete.length} questões foram excluídos com sucesso.`,
      totalQuestions: questionsMap.size,
    });
  });

  // 21. List & Resolve Reports (Admin)
  app.get('/api/admin/reports', (req, res) => {
    const list = Array.from(reportsMap.values()).sort((a, b) => b.createdAt - a.createdAt);
    res.json({ reports: list });
  });

  app.patch('/api/admin/reports/:id', (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const report = reportsMap.get(id);
    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    if (status === 'resolvido') report.resolvedAt = Date.now();

    reportsMap.set(id, report);
    saveDiskFile('reports_db.json', Array.from(reportsMap.values()));
    res.json({ report });
  });

  // Vite middleware / SPA fallback
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fiscal Questões] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
