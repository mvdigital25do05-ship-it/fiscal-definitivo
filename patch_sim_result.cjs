const fs = require('fs');
let code = fs.readFileSync('src/views/SimuladoResultView.tsx', 'utf8');

code = code.replace(/<QuestionCard\n/g, `<QuestionCard\n              userId={session.userId}\n`);

fs.writeFileSync('src/views/SimuladoResultView.tsx', code);
