const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldLogic = `    // Ordering
    if (filters.order === 'aleatoria' || !filters.order) {
      // 1. Generate or fetch base sequence for this caderno
      const seqKey = \`seq_\${uid}_\${filters.volume || 'todas'}_\${filters.caderno || 'todos'}\`;
      
      if (!cadernoSequencesMap.has(seqKey)) {`;

const newLogic = `    // Ordering
    if (filters.order === 'aleatoria' || !filters.order) {
      // 1. Generate or fetch base sequence for this caderno
      const seqKey = \`seq_\${uid}_\${filters.volume || 'todas'}_\${filters.caderno || 'todos'}\`;
      
      if (filters.forceShuffle) {
        cadernoSequencesMap.delete(seqKey);
      }
      
      if (!cadernoSequencesMap.has(seqKey)) {`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('server.ts', code);
console.log('Shuffle patched in server.ts');
