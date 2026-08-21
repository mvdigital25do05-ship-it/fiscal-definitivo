const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

const oldApplyFilter = `  const handleApplyFilter = (vol: string, cad: string, top: string, diff: string, typ: string, stat: string) => {
    setSelectedVolume(vol);
    setSelectedCaderno(cad);
    setSelectedTopic(top);
    setSelectedDifficulty(diff);
    setSelectedType(typ);
    setSelectedStatus(stat);

    onReloadSession({`;

const newApplyFilter = `  const handleApplyFilter = (vol: string, cad: string, top: string, diff: string, typ: string, stat: string) => {
    // Re-evaluate available topics for the new vol/cad selection
    let nextAvailableTopics: string[] = [];
    if (vol && vol !== 'todas') {
      if (cad && cad !== 'todos') {
         nextAvailableTopics = topicsByVolumeCaderno[vol]?.[cad] || [];
      } else {
         nextAvailableTopics = topicsByVolume[vol] || [];
      }
    } else if (cad && cad !== 'todos') {
      const topics = new Set<string>();
      Object.keys(topicsByVolumeCaderno).forEach(v => {
        if (topicsByVolumeCaderno[v] && topicsByVolumeCaderno[v][cad]) {
          topicsByVolumeCaderno[v][cad].forEach(t => topics.add(t));
        }
      });
      nextAvailableTopics = Array.from(topics);
    } else {
      nextAvailableTopics = allTopics;
    }

    // Reset topic if it is not found in the newly computed available topics
    let finalTopic = top;
    if (finalTopic !== 'todos' && !nextAvailableTopics.includes(finalTopic)) {
      finalTopic = 'todos';
    }

    setSelectedVolume(vol);
    setSelectedCaderno(cad);
    setSelectedTopic(finalTopic);
    setSelectedDifficulty(diff);
    setSelectedType(typ);
    setSelectedStatus(stat);

    onReloadSession({`;

code = code.replace(oldApplyFilter, newApplyFilter);

// Also need to fix the parameter passing in the selects. I'll replace `handleApplyFilter(selectedVolume, e.target.value, selectedTopic, ...)` 
// Wait, the parameters are (vol, cad, top, diff, typ, stat)
// Let's replace `onReloadSession({ volume: 'todas', caderno: 'todos', topic: 'todos', difficulty: 'todas', type: 'todas', personalStatus: 'todas' });` with clearing correctly
fs.writeFileSync('src/views/StudyView.tsx', code);
