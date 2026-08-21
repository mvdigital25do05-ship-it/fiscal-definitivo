const fs = require('fs');
let code = fs.readFileSync('src/views/SessionConfigView.tsx', 'utf8');

code = code.replace(
  /topicsByVolume: Record<string, string\[\]>;/,
  'topicsByVolume: Record<string, string[]>;\n    topicsByVolumeCaderno?: Record<string, Record<string, string[]>>;'
);

fs.writeFileSync('src/views/SessionConfigView.tsx', code);
