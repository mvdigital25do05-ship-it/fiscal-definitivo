const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

const missingLoad = `          if (meta.topicsByVolume) {
            setTopicsByVolume(meta.topicsByVolume);
            const allTopsSet = new Set<string>();
            Object.values(meta.topicsByVolume).forEach((topList) => {
              topList.forEach((t) => allTopsSet.add(t));
            });
            setAllTopics(Array.from(allTopsSet));
          }`;

const replacementLoad = `          if (meta.topicsByVolumeCaderno) {
            setTopicsByVolumeCaderno(meta.topicsByVolumeCaderno);
          }
          if (meta.topicsByVolume) {
            setTopicsByVolume(meta.topicsByVolume);
            const allTopsSet = new Set<string>();
            Object.values(meta.topicsByVolume).forEach((topList: any) => {
              topList.forEach((t: string) => allTopsSet.add(t));
            });
            setAllTopics(Array.from(allTopsSet));
          }`;

code = code.replace(missingLoad, replacementLoad);
fs.writeFileSync('src/views/StudyView.tsx', code);
