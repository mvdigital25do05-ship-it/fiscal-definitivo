const fs = require('fs');
let code = fs.readFileSync('src/components/QuestionCard.tsx', 'utf8');

// 1. Add eliminatedOpts state and timeout ref
const stateCode = `  const [eliminatedOpts, setEliminatedOpts] = useState<Record<string, boolean>>({});
  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);`;

code = code.replace(/  const \[selectedOpt, setSelectedOpt\] = useState<OptionKey \| null>\(/, stateCode + '\n  const [selectedOpt, setSelectedOpt] = useState<OptionKey | null>(');

// 2. Clear eliminatedOpts when question changes
const useEffectCode = `  useEffect(() => {
    setEliminatedOpts({});
  }, [question.id]);

  // Sync selected option when question changes`;
code = code.replace(/  \/\/ Sync selected option when question changes/, useEffectCode);

// 3. Replace handleOptionClick
const oldHandleOption = `  const handleOptionClick = (key: OptionKey) => {
    if (showFullResolution && mode === 'study') return;
    setSelectedOpt(key);
    onSelectOption(key);
  };`;

const newHandleOption = `  const handleOptionClick = (key: OptionKey) => {
    if (showFullResolution && mode === 'study') return;
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setEliminatedOpts(prev => ({ ...prev, [key]: !prev[key] }));
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        setSelectedOpt(key);
        onSelectOption(key);
      }, 200);
    }
  };`;

code = code.replace(oldHandleOption, newHandleOption);

// 4. Update option rendering
const beforeOptionMap = `            const isSelected = selectedOpt === key;
            const isThisCorrect = correctAnswer === key;`;

const afterOptionMap = `            const isSelected = selectedOpt === key;
            const isEliminated = !!eliminatedOpts[key];
            const isThisCorrect = correctAnswer === key;`;
code = code.replace(beforeOptionMap, afterOptionMap);

// 5. Update option rendering class injection for eliminated items
const oldOptionSpan = `                <span className="text-sm sm:text-[14.5px] leading-relaxed pt-0.5 flex-1 select-text font-normal">{text}</span>`;
const newOptionSpan = `                <span className={\`text-sm sm:text-[14.5px] leading-relaxed pt-0.5 flex-1 select-text font-normal \${isEliminated ? 'line-through opacity-40' : ''}\`}>{text}</span>`;
code = code.replace(oldOptionSpan, newOptionSpan);

fs.writeFileSync('src/components/QuestionCard.tsx', code);
