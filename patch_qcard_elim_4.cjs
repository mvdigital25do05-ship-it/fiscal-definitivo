const fs = require('fs');
let code = fs.readFileSync('src/components/QuestionCard.tsx', 'utf8');

code = code.replace(/200\);/g, "250);");

fs.writeFileSync('src/components/QuestionCard.tsx', code);
