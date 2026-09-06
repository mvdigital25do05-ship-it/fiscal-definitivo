import React, { useState, useEffect } from 'react';
import type { UserProfile, StudySession, SessionFilters } from './types';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { StudyView } from './views/StudyView';
import { DisciplinesTopicsView } from './views/DisciplinesTopicsView';
import { ErrorNotebookView } from './views/ErrorNotebookView';
import { AdminImportView } from './views/AdminImportView';
import { subscribeToAuthChanges, signOutUser } from './lib/firebase';
import { api } from './services/api';

const DEFAULT_USER: UserProfile = {
  uid: 'fiscal_stud_default',
  email: 'estudante@fiscal.com.br',
  displayName: 'Auditor em Formação',
  role: 'admin',
  createdAt: Date.now(),
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('fiscal_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [currentView, setCurrentView] = useState<'study' | 'disciplines' | 'errors' | 'import'>('study');
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Active Session state
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [sessionsCache, setSessionsCache] = useState<Record<string, StudySession>>({});
  const [sessionKeys, setSessionKeys] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('fiscal_session_keys');
      return stored ? JSON.parse(stored) : {};
    } catch (e) { return {}; }
  });

  const getSessionCacheKey = (f: any) => {
    return `${f.volume || 'todas'}-${f.caderno || 'todos'}-${f.topic || 'todos'}-${f.difficulty || 'todas'}-${f.type || 'todas'}-${f.personalStatus || 'todas'}-${f.order || 'aleatoria'}-${f.mode || 'study'}`;
  };
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(0);

  const userId = user?.uid || 'fiscal_stud_default';

  // Load question counts and filters meta
  const refreshQuestionsCount = async () => {
    try {
      const meta = await api.getFiltersMeta();
      if (meta && typeof meta.totalQuestions === 'number') {
        setTotalQuestionsCount(meta.totalQuestions);
      }
    } catch (err) {
      console.error('Error loading filters meta:', err);
    }
  };

  // Load or create active study session
  const loadStudySession = async (customFilters?: SessionFilters) => {
    setIsLoadingSession(true);
    try {
      const defaultFilters: SessionFilters = {
        difficulty: 'todas',
        type: 'todas',
        personalStatus: 'todas',
        order: 'aleatoria',
        mode: 'study',
        ...customFilters,
      };

      const cacheKey = getSessionCacheKey(defaultFilters);

      if (!defaultFilters.forceShuffle) {
        if (sessionsCache[cacheKey]) {
          setActiveSession(sessionsCache[cacheKey]);
          setIsLoadingSession(false);
          return;
        }
        
        const storedId = sessionKeys[cacheKey];
        if (storedId) {
          try {
            const restored = await api.getSession(storedId);
            if (restored && restored.questions.length > 0) {
              setSessionsCache(prev => ({ ...prev, [cacheKey]: restored }));
              setActiveSession(restored);
              setIsLoadingSession(false);
              return;
            }
          } catch(e) {}
        }
      }

      const session = await api.createSession({
        userId,
        filters: defaultFilters,
      });

      setSessionsCache(prev => ({ ...prev, [cacheKey]: session }));
      setSessionKeys(prev => {
        const next = { ...prev, [cacheKey]: session.id };
        localStorage.setItem('fiscal_session_keys', JSON.stringify(next));
        return next;
      });
      setActiveSession(session);
      await refreshQuestionsCount();
    } catch (err: any) {
      console.error('Error creating study session:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Initial mount: load study session & meta
  useEffect(() => {
    loadStudySession();
  }, [userId]);

  // Auth sync listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const synced = await api.syncUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'usuario@concurso.com.br',
            displayName: firebaseUser.displayName || 'Estudante Fiscal',
            photoURL: firebaseUser.photoURL || '',
          });
          setUser(synced);
          localStorage.setItem('fiscal_user', JSON.stringify(synced));
        } catch (err) {
          console.error('Error syncing user:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = async (authUser: any) => {
    try {
      const synced = await api.syncUser({
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        role: authUser.role,
      });
      setUser(synced);
      localStorage.setItem('fiscal_user', JSON.stringify(synced));
    } catch (err) {
      setUser(authUser);
      localStorage.setItem('fiscal_user', JSON.stringify(authUser));
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    localStorage.removeItem('fiscal_user');
  };

  const handleSelectDisciplineFromTree = (disciplineName: string) => {
    setCurrentView('study');
    loadStudySession({
      volume: disciplineName,
      topic: undefined,
      difficulty: 'todas',
      type: 'todas',
      personalStatus: 'todas',
      mode: 'study',
      order: 'aleatoria',
    });
  };

  const handleSelectTopicFromTree = (disciplineName: string, topicName: string) => {
    setCurrentView('study');
    loadStudySession({
      volume: disciplineName,
      topic: topicName,
      difficulty: 'todas',
      type: 'todas',
      personalStatus: 'todas',
      mode: 'study',
      order: 'aleatoria',
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#1A1A1A] flex flex-col font-sans antialiased selection:bg-[#1C1917] selection:text-[#FAF8F5]">
      {/* Sleek Top Navigation */}
      <Navbar
        user={user}
        onLoginClick={() => setLoginModalOpen(true)}
        onLogoutClick={handleLogout}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        totalQuestionsCount={totalQuestionsCount}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-6xl mx-auto w-full">
        {currentView === 'study' && (
          <StudyView
            session={activeSession}
            userId={userId}
            userEmail={user?.email}
            onUpdateSession={(updated) => {
              setActiveSession(updated);
              if (updated.filters) {
                const cacheKey = getSessionCacheKey(updated.filters);
                setSessionsCache(prev => ({ ...prev, [cacheKey]: updated }));
              }
              // Sync backend
              if (updated.id) {
                api.syncSessionState(updated.id, {
                  currentIndex: updated.currentIndex,
                  bookmarked: updated.bookmarked,
                  needsReview: updated.needsReview
                }).catch(console.error);
              }
            }}
            onNavigateToImport={() => setCurrentView('import')}
            onNavigateToDisciplines={() => setCurrentView('disciplines')}
            onReloadSession={loadStudySession}
            isLoading={isLoadingSession}
          />
        )}

        {currentView === 'disciplines' && (
          <DisciplinesTopicsView
            onSelectDiscipline={handleSelectDisciplineFromTree}
            onSelectTopic={handleSelectTopicFromTree}
            onNavigateToImport={() => setCurrentView('import')}
            onQuestionsModified={() => {
              refreshQuestionsCount();
              loadStudySession();
            }}
          />
        )}

        {currentView === 'errors' && (
          <ErrorNotebookView
            userId={userId}
            onStartSessionWithErrors={(errorFilters) => {
              setCurrentView('study');
              loadStudySession({
                ...errorFilters,
                personalStatus: 'caderno_erros',
                mode: 'study',
              });
            }}
          />
        )}

        {currentView === 'import' && (
          <AdminImportView
            onNavigateToStudy={() => {
              setCurrentView('study');
              loadStudySession();
            }}
            onQuestionsImported={() => {
              refreshQuestionsCount();
              loadStudySession();
            }}
          />
        )}
      </main>

      {/* Auth Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
