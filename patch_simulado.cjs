const fs = require('fs');
let code = fs.readFileSync('src/views/SimuladoView.tsx', 'utf8');

code = code.replace(/<QuestionCard\n/g, `<QuestionCard\n            userId={userId}\n`);

fs.writeFileSync('src/views/SimuladoView.tsx', code);
