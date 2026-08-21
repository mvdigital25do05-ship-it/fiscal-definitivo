const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSort = `    // Ordering
    if (filters.order === 'aleatoria' || !filters.order) {
      available = [...available].sort(() => Math.random() - 0.5);
    } else if (filters.order === 'recentes') {`;

const newSort = `    // Ordering
    if (filters.order === 'aleatoria' || !filters.order) {
      // 1. Generate or fetch base sequence for this caderno
      const seqKey = \`seq_\${uid}_\${filters.volume || 'todas'}_\${filters.caderno || 'todos'}\`;
      
      if (!cadernoSequencesMap.has(seqKey)) {
        // Generate a sequence of ALL questions for this caderno to ensure stability across topics
        let baseQuestions = Array.from(questionsMap.values()).filter((q) => q.status !== 'desativada');
        if (filters.volume && filters.volume !== 'todas') {
          baseQuestions = baseQuestions.filter((q) => q.volume === filters.volume);
        }
        if (filters.caderno && filters.caderno !== 'todos' && filters.caderno !== 'todas') {
          baseQuestions = baseQuestions.filter((q) => (q.caderno || 'Sem caderno') === filters.caderno);
        }
        // Shuffle base
        baseQuestions = [...baseQuestions].sort(() => Math.random() - 0.5);
        cadernoSequencesMap.set(seqKey, baseQuestions.map(q => q.id));
        saveDiskFile('caderno_sequences_db.json', Array.from(cadernoSequencesMap.entries()));
      }
      
      const sequence = cadernoSequencesMap.get(seqKey) || [];
      const orderMap = new Map(sequence.map((id, index) => [id, index]));
      
      available = [...available].sort((a, b) => {
        const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
        const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
        return idxA - idxB;
      });
    } else if (filters.order === 'recentes') {`;

code = code.replace(oldSort, newSort);
fs.writeFileSync('server.ts', code);
