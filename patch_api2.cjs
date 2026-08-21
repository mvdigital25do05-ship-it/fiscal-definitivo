const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

const t = `  // Get available filter choices and discipline hierarchy`;
const r = `  // Get Question History
  getQuestionHistory: async (userId: string, questionId: string) => {
    const res = await fetch(\`/api/questions/\${questionId}/history?userId=\${encodeURIComponent(userId)}\`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.attempts;
  },

  // Get available filter choices and discipline hierarchy`;

code = code.replace(t, r);
fs.writeFileSync('src/services/api.ts', code);
