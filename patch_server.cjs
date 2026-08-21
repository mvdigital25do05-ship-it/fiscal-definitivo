const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add map and loading
const mapCode = `const reportsMap = new Map<string, QuestionReport>();
const cadernoSequencesMap = new Map<string, string[]>(); // key -> questionIds
`;
code = code.replace(/const reportsMap = new Map<string, QuestionReport>\(\);/, mapCode);

const loadCode = `if (fs.existsSync(path.join(DATA_DIR, 'reports_db.json'))) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'reports_db.json'), 'utf-8'));
    data.forEach((item: any) => reportsMap.set(item[0], item[1]));
  } catch (e) {
    console.error('Error loading reports:', e);
  }
}

if (fs.existsSync(path.join(DATA_DIR, 'caderno_sequences_db.json'))) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'caderno_sequences_db.json'), 'utf-8'));
    data.forEach((item: any) => cadernoSequencesMap.set(item[0], item[1]));
  } catch (e) {
    console.error('Error loading sequences:', e);
  }
}`;
code = code.replace(/if \(fs.existsSync\(path.join\(DATA_DIR, 'reports_db.json'\)\)\) \{[\s\S]*?console.error\('Error loading reports:', e\);\n  \}\n\}/, loadCode);

fs.writeFileSync('server.ts', code);
