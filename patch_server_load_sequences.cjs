const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const anchor = `  const diskQuestions = readDiskFile<Question[]>('questions_db.json', []);
  const deletedQuestionIds = readDiskFile<string[]>('deleted_questions_db.json', []);`;

const newCode = `  const diskQuestions = readDiskFile<Question[]>('questions_db.json', []);
  const deletedQuestionIds = readDiskFile<string[]>('deleted_questions_db.json', []);
  const diskSequences = readDiskFile<[string, string[]][]>('caderno_sequences_db.json', []);
  diskSequences.forEach(([k, v]) => cadernoSequencesMap.set(k, v));`;

code = code.replace(anchor, newCode);
fs.writeFileSync('server.ts', code);
console.log('Server load sequences patched');
