const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  app.post('/api/user/reset-stats', async (req, res) => {
    const { userId } = req.body || {};
    const uid = userId || 'demo-user';

    // 1. Clear attempts for uid in memory & disk
    attemptsMap.set(uid, []);
    saveDiskFile('attempts_db.json', Array.from(attemptsMap.entries()));

    // 2. Clear firestore attempts if available
    if (firestoreDb) {
      try {
        const snap = await getDocs(collection(firestoreDb, 'users', uid, 'attempts'));
        const batchOps = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(batchOps);
      } catch (e) {
        console.warn(\`Firestore error clearing attempts for user \${uid}:\`, e);
      }
    }`;

const replacement = `  app.post('/api/user/reset-stats', async (req, res) => {
    const { userId } = req.body || {};
    const uid = userId || 'demo-user';

    // 1. Clear correct attempts for uid in memory & disk, and hide wrong ones from stats
    let userAttempts = attemptsMap.get(uid) || [];
    userAttempts = userAttempts.filter((a) => !a.isCorrect);
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
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
