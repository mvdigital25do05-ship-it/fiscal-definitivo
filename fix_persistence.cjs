const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/saveDiskFile\('questions_db\.json', Array\.from\(questionsMap\.values\(\)\)\);\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore save error for question \$\{q\.id\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('questions_db.json', Array.from(questionsMap.values()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'questions', q.id), cleanForFirestore(q)).catch(e => console.warn(\`Firestore save error for question \${q.id}:\`, e));
  }`
);

code = code.replace(/saveDiskFile\('questions_db\.json', Array\.from\(questionsMap\.values\(\)\)\);\n\s*if \(firestoreDb\) \{\n\s*for \(const q of questions\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore batch error for question \$\{q\.id\}:`, e\);\n\s*\}\n\s*\}\n\s*\}/g,
  `saveDiskFile('questions_db.json', Array.from(questionsMap.values()));
  if (firestoreDb) {
    for (const q of questions) {
      setDoc(doc(firestoreDb, 'questions', q.id), cleanForFirestore(q)).catch(e => console.warn(\`Firestore batch error for question \${q.id}:\`, e));
    }
  }`
);

code = code.replace(/saveDiskFile\('question_versions_db\.json', Array\.from\(questionVersionsMap\.entries\(\)\)\);\n\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore delete error for question \$\{id\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('question_versions_db.json', Array.from(questionVersionsMap.entries()));
  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'questions', id)).catch(e => console.warn(\`Firestore delete error for question \${id}:\`, e));
  }`
);

code = code.replace(/saveDiskFile\('question_versions_db\.json', Array\.from\(questionVersionsMap\.entries\(\)\)\);\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore error saving version \$\{snap\.versionId\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('question_versions_db.json', Array.from(questionVersionsMap.entries()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'questionVersions', snap.versionId), cleanForFirestore(snap)).catch(e => console.warn(\`Firestore error saving version \${snap.versionId}:\`, e));
  }`
);

code = code.replace(/saveDiskFile\('imports_db\.json', Array\.from\(importsMap\.values\(\)\)\);\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore error saving import batch \$\{batch\.batchId\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('imports_db.json', Array.from(importsMap.values()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'imports', batch.batchId), cleanForFirestore(batch)).catch(e => console.warn(\`Firestore error saving import batch \${batch.batchId}:\`, e));
  }`
);

code = code.replace(/saveDiskFile\('imports_db\.json', Array\.from\(importsMap\.values\(\)\)\);\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore error deleting import batch \$\{batchId\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('imports_db.json', Array.from(importsMap.values()));
  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'imports', batchId)).catch(e => console.warn(\`Firestore error deleting import batch \${batchId}:\`, e));
  }`
);

code = code.replace(/saveDiskFile\('users_db\.json', Array\.from\(usersMap\.values\(\)\)\);\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore error saving user \$\{user\.uid\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('users_db.json', Array.from(usersMap.values()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', user.uid), cleanForFirestore(user), { merge: true }).catch(e => console.warn(\`Firestore error saving user \${user.uid}:\`, e));
  }`
);

code = code.replace(/saveDiskFile\('attempts_db\.json', Array\.from\(attemptsMap\.entries\(\)\)\);\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore error saving attempt \$\{attempt\.id\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('attempts_db.json', Array.from(attemptsMap.entries()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', attempt.userId, 'attempts', attempt.id), cleanForFirestore(attempt)).catch(e => console.warn(\`Firestore error saving attempt \${attempt.id}:\`, e));
  }`
);

code = code.replace(/saveDiskFile\('favorites_db\.json', serialized\);\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore error saving favorite for \$\{fav\.questionId\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('favorites_db.json', serialized);
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', userId, 'favorites', fav.questionId), cleanForFirestore(fav)).catch(e => console.warn(\`Firestore error saving favorite for \${fav.questionId}:\`, e));
  }`
);

code = code.replace(/saveDiskFile\('sessions_db\.json', Array\.from\(sessionsMap\.values\(\)\)\);\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore error saving session \$\{session\.id\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('sessions_db.json', Array.from(sessionsMap.values()));
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', session.userId, 'sessions', session.id), cleanForFirestore(session)).catch(e => console.warn(\`Firestore error saving session \${session.id}:\`, e));
  }`
);

code = code.replace(/saveDiskFile\('error_notebook_db\.json', serialized\);\n\n\s*if \(firestoreDb\) \{\n\s*try \{ await ; \} catch \(e\) \{\n\s*console\.warn\(`Firestore error saving error notebook for \$\{questionId\}:`, e\);\n\s*\}\n\s*\}/g,
  `saveDiskFile('error_notebook_db.json', serialized);
  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'users', userId, 'error_notebook', questionId), cleanForFirestore(meta)).catch(e => console.warn(\`Firestore error saving error notebook for \${questionId}:\`, e));
  }`
);


fs.writeFileSync('server.ts', code);
