const fs = require('fs');
const classes = [
'bg-[#0C0A09]', 'bg-[#15803D]', 'bg-[#166534]', 'bg-[#1A1A1A]', 'bg-[#1C1917]', 'bg-[#292524]', 'bg-[#4F46E5]', 'bg-[#991B1B]', 'bg-[#B45309]', 'bg-[#B91C1C]', 'bg-[#D97706]', 'bg-[#DCFCE7]', 'bg-[#EAE5D9]', 'bg-[#EAE6DF]', 'bg-[#ECFDF5]', 'bg-[#EDE9FE]', 'bg-[#EEF2FF]', 'bg-[#F0ECE1]', 'bg-[#F0FDF4]', 'bg-[#F2ECE0]', 'bg-[#F2EDE4]', 'bg-[#F59E0B]', 'bg-[#F5F2EB]', 'bg-[#FAF5FF]', 'bg-[#FAF8F5]', 'bg-[#FCA5A5]', 'bg-[#FDFCF8]', 'bg-[#FEE2E2]', 'bg-[#FEF2F2]', 'bg-[#FEF3C7]', 'bg-[#FEF9C3]', 'bg-[#FEFCE8]', 'bg-[#FFFBEB]',
'border-[#15803D]', 'border-[#166534]', 'border-[#1C1917]', 'border-[#292524]', 'border-[#7C3AED]', 'border-[#86EFAC]', 'border-[#A7F3D0]', 'border-[#A8A29E]', 'border-[#B45309]', 'border-[#B91C1C]', 'border-[#BBF7D0]', 'border-[#C7D2FE]', 'border-[#D6CEBE]', 'border-[#DDD6FE]', 'border-[#EAE6DF]', 'border-[#F2ECE0]', 'border-[#F2EDE4]', 'border-[#FCA5A5]', 'border-[#FDE68A]', 'border-[#FECACA]', 'border-[#FEF08A]',
'ring-[#1C1917]', 'ring-[#22C55E]', 'ring-[#7C3AED]', 'ring-[#B91C1C]', 'ring-[#EF4444]',
'text-[#059669]', 'text-[#065F46]', 'text-[#14532D]', 'text-[#15803D]', 'text-[#166534]', 'text-[#16A34A]', 'text-[#1A1A1A]', 'text-[#1C1917]', 'text-[#22C55E]', 'text-[#292524]', 'text-[#3730A3]', 'text-[#4338CA]', 'text-[#44403C]', 'text-[#57534E]', 'text-[#6D28D9]', 'text-[#713F12]', 'text-[#78716C]', 'text-[#7C3AED]', 'text-[#7F1D1D]', 'text-[#854D0E]', 'text-[#8B5CF6]', 'text-[#92400E]', 'text-[#991B1B]', 'text-[#A16207]', 'text-[#A8A29E]', 'text-[#B45309]', 'text-[#B91C1C]', 'text-[#CA8A04]', 'text-[#D6CEBE]', 'text-[#D6D3D1]', 'text-[#D97706]', 'text-[#DC2626]', 'text-[#EAE5D9]', 'text-[#EF4444]', 'text-[#FAF8F5]', 'text-[#FDFCF8]'
];

const colorMap = {
  '#FDFCF8': '#09090b', '#FAF8F5': '#18181b', '#F5F2EB': '#27272a', '#F2EDE4': '#27272a', '#F2ECE0': '#27272a', '#F0ECE1': '#27272a', '#EAE6DF': '#3f3f46', '#EAE5D9': '#3f3f46', '#D6CEBE': '#52525b', '#D6D3D1': '#52525b', '#A8A29E': '#71717a', '#78716C': '#a1a1aa', '#57534E': '#d4d4d8', '#44403C': '#e4e4e7', '#292524': '#e4e4e7', '#1C1917': '#fafafa', '#1A1A1A': '#fafafa', '#0C0A09': '#ffffff',
  '#F0FDF4': '#052e16', '#ECFDF5': '#052e16', '#DCFCE7': '#052e16', '#BBF7D0': '#14532d', '#A7F3D0': '#14532d', '#86EFAC': '#166534', '#22C55E': '#22c55e', '#16A34A': '#4ade80', '#15803D': '#4ade80', '#166534': '#86efac', '#14532D': '#86efac', '#065F46': '#86efac', '#059669': '#4ade80',
  '#FEF2F2': '#450a0a', '#FEE2E2': '#450a0a', '#FECACA': '#7f1d1d', '#FCA5A5': '#7f1d1d', '#EF4444': '#ef4444', '#DC2626': '#f87171', '#B91C1C': '#f87171', '#991B1B': '#fca5a5', '#7F1D1D': '#fca5a5',
  '#FFFBEB': '#422006', '#FEFCE8': '#422006', '#FEF9C3': '#422006', '#FEF3C7': '#422006', '#FEF08A': '#78350f', '#FDE68A': '#78350f', '#F59E0B': '#fbbf24', '#D97706': '#fbbf24', '#CA8A04': '#fcd34d', '#B45309': '#fcd34d', '#A16207': '#fde68a', '#92400E': '#fde68a', '#854D0E': '#fde68a', '#713F12': '#fde68a',
  '#FAF5FF': '#2e1065', '#EEF2FF': '#312e81', '#EDE9FE': '#2e1065', '#DDD6FE': '#4c1d95', '#C7D2FE': '#4338ca', '#8B5CF6': '#a78bfa', '#7C3AED': '#a78bfa', '#6D28D9': '#c4b5fd', '#4F46E5': '#818cf8', '#4338CA': '#818cf8', '#3730A3': '#a5b4fc',
};

let cssOutput = "\n/* --- DARK MODE OVERRIDES --- */\n.dark {\n  background-color: #09090b !important;\n  color: #fafafa !important;\n}\n\n";

for (const cls of classes) {
  const match = cls.match(/\[(#[0-9A-Fa-f]{6})\]/);
  if (!match) continue;
  const hex = match[1].toUpperCase();
  const mapped = colorMap[hex];
  if (!mapped) continue;
  
  const selector = '.' + cls.replace('[', '\\\\[').replace('#', '\\\\#').replace(']', '\\\\]');
  
  let prop = 'background-color';
  if (cls.startsWith('text')) prop = 'color';
  if (cls.startsWith('border')) prop = 'border-color';
  if (cls.startsWith('ring')) prop = '--tw-ring-color';
  
  cssOutput += ".dark " + selector + " { " + prop + ": " + mapped + " !important; }\n";
}

cssOutput += `
.dark .bg-white { background-color: #18181b !important; }
.dark .text-white { color: #fafafa !important; }
.dark .border-white { border-color: #27272a !important; }
.dark .hover\\:bg-\\[\\#F2ECE0\\]:hover { background-color: #27272a !important; }
.dark .hover\\:bg-\\[\\#FAF8F5\\]:hover { background-color: #18181b !important; }
.dark .hover\\:bg-\\[\\#EAE6DF\\]:hover { background-color: #3f3f46 !important; }
.dark .hover\\:bg-\\[\\#292524\\]:hover { background-color: #e4e4e7 !important; }
.dark .hover\\:bg-\\[\\#166534\\]:hover { background-color: #4ade80 !important; }
.dark .hover\\:bg-white:hover { background-color: #18181b !important; }
.dark .hover\\:border-\\[\\#D6CEBE\\]:hover { border-color: #52525b !important; }
.dark .hover\\:border-\\[\\#A8A29E\\]:hover { border-color: #71717a !important; }
.dark .bg-\\[\\#FAF8F5\\]\\/60 { background-color: rgba(24, 24, 27, 0.6) !important; }
.dark .bg-\\[\\#FAF8F5\\]\\/15 { background-color: rgba(24, 24, 27, 0.15) !important; }
.dark .bg-\\[\\#EAE5D9\\]\\/60 { background-color: rgba(63, 63, 70, 0.6) !important; }
.dark .bg-\\[\\#F0FDF4\\]\\/50 { background-color: rgba(5, 46, 22, 0.5) !important; }
.dark .bg-\\[\\#FEF2F2\\]\\/60 { background-color: rgba(69, 10, 10, 0.6) !important; }
`;

fs.appendFileSync('src/index.css', cssOutput);
console.log('Done!');
