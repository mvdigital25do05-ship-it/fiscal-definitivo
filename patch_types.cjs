const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

code = code.replace(
  /order\?: OrderFilter;/,
  'order?: OrderFilter;\n  forceShuffle?: boolean;'
);

fs.writeFileSync('src/types/index.ts', code);
