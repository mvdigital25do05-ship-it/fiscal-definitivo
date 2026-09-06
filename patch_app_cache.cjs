const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor1 = `  const [activeSession, setActiveSession] = useState<StudySession | null>(null);`;
const replace1 = `  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [sessionsCache, setSessionsCache] = useState<Record<string, StudySession>>({});

  const getSessionCacheKey = (f: any) => {
    return \`\${f.volume || 'todas'}-\${f.caderno || 'todos'}-\${f.topic || 'todos'}-\${f.difficulty || 'todas'}-\${f.type || 'todas'}-\${f.personalStatus || 'todas'}-\${f.order || 'aleatoria'}-\${f.mode || 'study'}\`;
  };`;

const anchor2 = `  const loadStudySession = async (customFilters?: SessionFilters) => {
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

      const session = await api.createSession({
        userId,
        filters: defaultFilters,
      });

      setActiveSession(session);`;

const replace2 = `  const loadStudySession = async (customFilters?: SessionFilters) => {
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

      if (sessionsCache[cacheKey] && !defaultFilters.forceShuffle) {
        setActiveSession(sessionsCache[cacheKey]);
        setIsLoadingSession(false);
        return;
      }

      const session = await api.createSession({
        userId,
        filters: defaultFilters,
      });

      setSessionsCache(prev => ({ ...prev, [cacheKey]: session }));
      setActiveSession(session);`;

const anchor3 = `            onUpdateSession={(updated) => setActiveSession(updated)}`;
const replace3 = `            onUpdateSession={(updated) => {
              setActiveSession(updated);
              if (updated.filters) {
                const cacheKey = getSessionCacheKey(updated.filters);
                setSessionsCache(prev => ({ ...prev, [cacheKey]: updated }));
              }
            }}`;

code = code.replace(anchor1, replace1).replace(anchor2, replace2).replace(anchor3, replace3);
fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx patched for session caching');
