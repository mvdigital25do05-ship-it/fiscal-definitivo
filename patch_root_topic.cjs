const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      cadernoCounts,
      cadernoDoneCounts,
      difficultyCounts,`;
const replacement = `      cadernoCounts,
      cadernoDoneCounts,
      topicCounts,
      topicDoneCounts,
      difficultyCounts,`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
