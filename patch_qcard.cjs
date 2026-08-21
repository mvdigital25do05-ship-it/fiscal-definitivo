const fs = require('fs');
let code = fs.readFileSync('src/components/QuestionCard.tsx', 'utf8');

// Imports
const t1 = `import {
  Star,`;
const r1 = `import {
  Star,
  History,`;
code = code.replace(t1, r1);

// Add QuestionHistoryModal import
const t2 = `import { ReportIssueModal } from '../components/ReportIssueModal';`; // Wait, is ReportIssueModal inside QuestionCard? No, QuestionCard doesn't import ReportIssueModal, it receives onOpenReport.
const r2 = `import { QuestionHistoryModal } from './QuestionHistoryModal';`;
// Let's just find the imports end
code = code.replace(`import type { SanitizedQuestion, OptionKey, SessionAnswerState } from '../types';`, `import type { SanitizedQuestion, OptionKey, SessionAnswerState } from '../types';
import { QuestionHistoryModal } from './QuestionHistoryModal';`);

// Props
const t3 = `  isSubmitting = false,
}) => {`;
const r3 = `  userId,
  isSubmitting = false,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);`;
code = code.replace(/  isSubmitting = false,\n\}\) => \{/, r3);
// Ensure we add userId to Props interface
code = code.replace(/  isSubmitting\?: boolean;\n\}/, `  isSubmitting?: boolean;\n  userId?: string;\n}`);

// Add History button before Trash2
const t4 = `          {onDeleteQuestion && (
            <button
              id={\`delete-question-btn-\${question.id}\`}`;
const r4 = `          {userId && (
            <>
              <button
                id={\`history-btn-\${question.id}\`}
                onClick={() => setIsHistoryOpen(true)}
                title="Ver histórico desta questão"
                className="p-1.5 rounded-lg border bg-white border-[#EAE6DF] text-[#78716C] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
              </button>
              <QuestionHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                questionId={question.id}
                userId={userId}
              />
            </>
          )}

          {onDeleteQuestion && (
            <button
              id={\`delete-question-btn-\${question.id}\`}`;
code = code.replace(t4, r4);

fs.writeFileSync('src/components/QuestionCard.tsx', code);
