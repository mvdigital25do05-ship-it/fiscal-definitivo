const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

code = code.replace(
  /resetUserStats: async \(userId: string\): Promise<\{ success: boolean; message: string \}> => \{/,
  'resetUserStats: async (userId: string, volume?: string, caderno?: string): Promise<{ success: boolean; message: string }> => {'
);
code = code.replace(
  /body: JSON.stringify\(\{ userId \}\),/,
  'body: JSON.stringify({ userId, volume, caderno }),'
);

fs.writeFileSync('src/services/api.ts', code);
