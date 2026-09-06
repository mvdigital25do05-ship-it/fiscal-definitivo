const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace bg-[#FDFCF8] with bg-[#f4f6f8]
content = content.replace('bg-[#FDFCF8]', 'bg-[#f4f6f8]');
// remove max-w-7xl mx-auto from main if needed, or leave it. The screenshot looks like a wide container or full width. 
// "max-w-7xl" is 1280px. Tec is usually around 1140px. Let's keep max-w-6xl or something.
content = content.replace('max-w-7xl mx-auto w-full', 'max-w-6xl mx-auto w-full');

fs.writeFileSync('src/App.tsx', content, 'utf8');
