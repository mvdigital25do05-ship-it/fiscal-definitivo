const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

const target = `{currentAvailableTopics.map((top) => (
                <option key={top} value={top}>
                  {top}
                </option>
              ))}`;

const replacement = `{currentAvailableTopics.map((top) => {
                let totalC = 0;
                let doneC = 0;
                
                const processCaderno = (v, c) => {
                  totalC += (topicCounts && topicCounts[v] && topicCounts[v][c] && topicCounts[v][c][top]) ? topicCounts[v][c][top] : 0;
                  doneC += (topicDoneCounts && topicDoneCounts[v] && topicDoneCounts[v][c] && topicDoneCounts[v][c][top]) ? topicDoneCounts[v][c][top] : 0;
                };

                if (selectedVolume !== 'todas') {
                  if (selectedCaderno !== 'todos') {
                    processCaderno(selectedVolume, selectedCaderno);
                  } else {
                    Object.keys(cadernoCounts[selectedVolume] || {}).forEach(c => processCaderno(selectedVolume, c));
                  }
                } else {
                  Object.keys(topicCounts).forEach(v => {
                    Object.keys(topicCounts[v] || {}).forEach(c => processCaderno(v, c));
                  });
                }
                
                const label = totalC > 0 ? \`\${top} (\${doneC}/\${totalC} feitas)\` : top;
                return (
                  <option key={top} value={top}>
                    {label}
                  </option>
                );
              })}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/views/StudyView.tsx', code);
