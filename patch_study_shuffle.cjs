const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

const oldShuffle = `  const handleShuffle = () => {
    onReloadSession({
      volume: selectedVolume !== 'todas' ? selectedVolume : undefined,
      caderno: selectedCaderno !== 'todos' ? selectedCaderno : undefined,
      topic: selectedTopic !== 'todos' ? selectedTopic : undefined,
      difficulty: selectedDifficulty,
      type: selectedType,
      personalStatus: selectedStatus,
      mode: 'study',
      order: 'aleatoria',
    });
  };`;

const newShuffle = `  const handleShuffle = () => {
    onReloadSession({
      volume: selectedVolume !== 'todas' ? selectedVolume : undefined,
      caderno: selectedCaderno !== 'todos' ? selectedCaderno : undefined,
      topic: selectedTopic !== 'todos' ? selectedTopic : undefined,
      difficulty: selectedDifficulty,
      type: selectedType,
      personalStatus: selectedStatus,
      mode: 'study',
      order: 'aleatoria',
      forceShuffle: true,
    });
  };`;

code = code.replace(oldShuffle, newShuffle);
fs.writeFileSync('src/views/StudyView.tsx', code);
console.log('Shuffle patched in StudyView');
