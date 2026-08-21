const fs = require('fs');
let code = fs.readFileSync('src/components/QuestionCard.tsx', 'utf8');

// The button has className={\`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 group cursor-pointer disabled:cursor-default \${optionStyle}\`}
// I will append \${isEliminated ? 'opacity-50' : ''} to it

code = code.replace(/className=\{\`w-full text-left(.*?)\$\{optionStyle\}\`\}/, 'className={\`w-full text-left$1\${optionStyle} \${isEliminated ? \\\'opacity-50\\\' : \\\'\\\'}\`}');

fs.writeFileSync('src/components/QuestionCard.tsx', code);
