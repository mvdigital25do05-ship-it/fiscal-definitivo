const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

const t = `  cadernoCounts?: Record<string, Record<string, number>>;
  difficultyCounts: Record<string, number>;`;
const r = `  cadernoCounts?: Record<string, Record<string, number>>;
  cadernoDoneCounts?: Record<string, Record<string, number>>;
  topicCounts?: Record<string, Record<string, Record<string, number>>>;
  topicDoneCounts?: Record<string, Record<string, Record<string, number>>>;
  difficultyCounts: Record<string, number>;`;

code = code.replace(t, r);
fs.writeFileSync('src/types/index.ts', code);
