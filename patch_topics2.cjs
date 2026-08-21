const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

const t = `                if (selectedVolume !== 'todas') {
                  if (selectedCaderno !== 'todos') {
                    processCaderno(selectedVolume, selectedCaderno);
                  } else {
                    Object.keys(cadernoCounts[selectedVolume] || {}).forEach(c => processCaderno(selectedVolume, c));
                  }
                } else {
                  Object.keys(topicCounts).forEach(v => {
                    Object.keys(topicCounts[v] || {}).forEach(c => processCaderno(v, c));
                  });
                }`;

const r = `                if (selectedVolume !== 'todas') {
                  if (selectedCaderno !== 'todos') {
                    processCaderno(selectedVolume, selectedCaderno);
                  } else {
                    Object.keys(cadernoCounts[selectedVolume] || {}).forEach(c => processCaderno(selectedVolume, c));
                  }
                } else {
                  Object.keys(topicCounts).forEach(v => {
                    if (selectedCaderno !== 'todos') {
                      processCaderno(v, selectedCaderno);
                    } else {
                      Object.keys(topicCounts[v] || {}).forEach(c => processCaderno(v, c));
                    }
                  });
                }`;

code = code.replace(t, r);
fs.writeFileSync('src/views/StudyView.tsx', code);
