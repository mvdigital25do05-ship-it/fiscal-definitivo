const fs = require('fs');
let code = fs.readFileSync('src/views/SessionConfigView.tsx', 'utf8');

const regex3 = /return \[\];\n  \}, \[volume, caderno, meta\.topicsByVolume, meta\.topicsByVolumeCaderno\]\);/g;
const replacement3 = `
    const allTopics = new Set<string>();
    if (meta.topicsByVolume) {
      Object.values(meta.topicsByVolume).forEach(topList => {
        topList.forEach(t => allTopics.add(t));
      });
    }
    return Array.from(allTopics);
  }, [volume, caderno, meta.topicsByVolume, meta.topicsByVolumeCaderno]);`;

code = code.replace(regex3, replacement3);
fs.writeFileSync('src/views/SessionConfigView.tsx', code);
