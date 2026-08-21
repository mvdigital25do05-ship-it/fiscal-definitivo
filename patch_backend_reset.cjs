const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldBackendReset = `  // 10.1 Reset User Performance & Statistics
  app.post('/api/user/reset-stats', async (req, res) => {
    const { userId } = req.body || {};
    const uid = userId || 'demo-user';

    // 1. Clear correct attempts for uid in memory & disk, and hide wrong ones from stats
    let userAttempts = attemptsMap.get(uid) || [];
    // userAttempts = userAttempts.filter((a) => !a.isCorrect); // Preserve all for history
    userAttempts.forEach((a) => (a.hiddenFromStats = true));
    attemptsMap.set(uid, userAttempts);
    saveDiskFile('attempts_db.json', Array.from(attemptsMap.entries()));

    // 2. Clear firestore attempts if available
    if (firestoreDb) {
      try {
        const snap = await getDocs(collection(firestoreDb, 'users', uid, 'attempts'));
        const batchOps = snap.docs.map((d) => {
          const data = d.data();
          if (data.isCorrect) {
            return deleteDoc(d.ref);
          } else {
            return setDoc(d.ref, { ...data, hiddenFromStats: true }, { merge: true });
          }
        });
        await Promise.all(batchOps);
      } catch (e) {
        console.warn(\`Firestore error clearing attempts for user \${uid}:\`, e);
      }
    }

    // 3. Reset active study sessions for this user
    sessionsMap.forEach((session) => {
      if (session.userId === uid) {
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
    });
    saveDiskFile('sessions_db.json', Array.from(sessionsMap.values()));

    return res.json({ success: true, message: 'Desempenho geral zerado com sucesso.' });
  });`;

const newBackendReset = `  // 10.1 Reset User Performance & Statistics
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
         if (key.startsWith(\`seq_\${uid}_\`)) {
           cadernoSequencesMap.delete(key);
         }
       }
    } else {
       const seqKey = \`seq_\${uid}_\${volume || 'todas'}_\${caderno || 'todos'}\`;
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
        console.warn(\`Firestore error clearing attempts for user \${uid}:\`, e);
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
  });`;

if (code.includes(oldBackendReset)) {
  code = code.replace(oldBackendReset, newBackendReset);
  fs.writeFileSync('server.ts', code);
  console.log('Backend reset stats successfully patched!');
} else {
  console.log('Error: Could not find old backend reset code to patch.');
}
