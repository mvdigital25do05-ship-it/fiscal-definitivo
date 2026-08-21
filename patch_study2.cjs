const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

code = code.replace(/user\?\.uid/g, 'userId');
code = code.replace(/Object\.values\(cadernosByVolume\)\.forEach\(\(cads\) => \{/g, '(Object.values(cadernosByVolume) as string[][]).forEach((cads) => {');

fs.writeFileSync('src/views/StudyView.tsx', code);
