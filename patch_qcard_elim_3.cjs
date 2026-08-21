const fs = require('fs');
let code = fs.readFileSync('src/components/QuestionCard.tsx', 'utf8');

code = code.replace(/isEliminated \? 'line-through opacity-40' : ''/g, "isEliminated ? 'line-through text-[#A8A29E]' : ''");

fs.writeFileSync('src/components/QuestionCard.tsx', code);
