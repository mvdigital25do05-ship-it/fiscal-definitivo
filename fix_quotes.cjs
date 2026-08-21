const fs = require('fs');
let code = fs.readFileSync('src/components/QuestionCard.tsx', 'utf8');

code = code.replace(/isEliminated \? \\'opacity-50\\' : \\'\\'/g, "isEliminated ? 'opacity-50' : ''");

fs.writeFileSync('src/components/QuestionCard.tsx', code);
