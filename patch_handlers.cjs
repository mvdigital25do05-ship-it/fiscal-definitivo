const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');
code = code.replace(`  const handleCadernoChange = (newCad: string) => {
    handleApplyFilter(selectedVolume, newCad, selectedTopic, selectedDifficulty, selectedType, selectedStatus);
  };`, `  const handleCadernoChange = (newCad: string) => {
    // Reset topic when caderno changes
    handleApplyFilter(selectedVolume, newCad, 'todos', selectedDifficulty, selectedType, selectedStatus);
  };`);
fs.writeFileSync('src/views/StudyView.tsx', code);
