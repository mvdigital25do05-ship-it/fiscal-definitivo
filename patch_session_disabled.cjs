const fs = require('fs');
let code = fs.readFileSync('src/views/SessionConfigView.tsx', 'utf8');

code = code.replace(/disabled=\{volume === 'todas' \|\| availableCadernos\.length === 0\}/g, "disabled={availableCadernos.length === 0}");
code = code.replace(/disabled=\{volume === 'todas' \|\| availableTopics\.length === 0\}/g, "disabled={availableTopics.length === 0}");
code = code.replace(/disabled=\{topic === 'todos' \|\| availableSubtopics\.length === 0\}/g, "disabled={availableSubtopics.length === 0}");

fs.writeFileSync('src/views/SessionConfigView.tsx', code);
