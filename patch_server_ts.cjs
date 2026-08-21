const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(`const initialAnswers: Record<string, SessionAnswerState> = {};`, `const initialAnswers: Record<string, any> = {};`);
fs.writeFileSync('server.ts', code);
