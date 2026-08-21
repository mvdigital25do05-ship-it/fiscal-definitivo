const fs = require('fs');

let study = fs.readFileSync('src/views/StudyView.tsx', 'utf8');
study = study.replace(/console\.log\('Computing topics:', \{ selectedVolume, selectedCaderno, topicsByVolumeCaderno \}\);\n/g, '');
fs.writeFileSync('src/views/StudyView.tsx', study);

let session = fs.readFileSync('src/views/SessionConfigView.tsx', 'utf8');
session = session.replace(/console\.log\('SessionConfig Computing topics:', \{ volume, caderno, topicsByVolumeCaderno: meta\.topicsByVolumeCaderno \}\);\n/g, '');
fs.writeFileSync('src/views/SessionConfigView.tsx', session);
