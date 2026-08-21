const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

const t = `  // Get filters and metadata`;
const r = `  // Get Question History
  getQuestionHistory: async (userId: string, questionId: string) => {
    const res = await fetch(\`/api/questions/\${questionId}/history?userId=\${userId}\`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.attempts;
  },

  // Get filters and metadata`;

code = code.replace(t, r);
fs.writeFileSync('src/services/api.ts', code);
