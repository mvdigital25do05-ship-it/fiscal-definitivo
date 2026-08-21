const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

const target = `{currentAvailableCadernos.map((cad) => (
                <option key={cad} value={cad}>
                  {cad}
                </option>
              ))}`;

const replacement = `{currentAvailableCadernos.map((cad) => {
                let totalC = 0;
                let doneC = 0;
                if (selectedVolume !== 'todas') {
                  totalC = cadernoCounts[selectedVolume]?.[cad] || 0;
                  doneC = cadernoDoneCounts[selectedVolume]?.[cad] || 0;
                } else {
                  Object.keys(cadernoCounts).forEach((v) => {
                    totalC += cadernoCounts[v]?.[cad] || 0;
                    doneC += (cadernoDoneCounts && cadernoDoneCounts[v] && cadernoDoneCounts[v][cad]) ? cadernoDoneCounts[v][cad] : 0;
                  });
                }
                const label = totalC > 0 ? \`\${cad} (\${doneC}/\${totalC} feitas)\` : cad;
                return (
                  <option key={cad} value={cad}>
                    {label}
                  </option>
                );
              })}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/views/StudyView.tsx', code);
