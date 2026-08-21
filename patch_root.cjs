const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      cadernoCounts,
      difficultyCounts,`;
const replacement = `      cadernoCounts,
      cadernoDoneCounts,
      difficultyCounts,`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
