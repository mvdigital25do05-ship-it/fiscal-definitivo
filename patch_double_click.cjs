const fs = require('fs');
let code = fs.readFileSync('src/components/QuestionCard.tsx', 'utf8');

code = code.replace(
  /const clickTimeoutRef = useRef<NodeJS\.Timeout \| null>\(null\);/g,
  'const clickStateRef = useRef<{ timeout: NodeJS.Timeout | null; key: string | null }>({ timeout: null, key: null });'
);

const oldClickLogic = `    // If the option is already eliminated, a single click restores it immediately
    if (eliminatedOpts[key]) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      setEliminatedOpts(prev => ({ ...prev, [key]: false }));
      return;
    }

    if (clickTimeoutRef.current) {
      // Double click detected -> Eliminate it
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setEliminatedOpts(prev => ({ ...prev, [key]: true }));
    } else {
      // Single click detected -> Wait to see if it's a double click
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        setSelectedOpt(key);
        onSelectOption(key);
      }, 250);
    }`;

const newClickLogic = `    // If the option is already eliminated, a single click restores it immediately
    if (eliminatedOpts[key]) {
      if (clickStateRef.current.timeout) {
        clearTimeout(clickStateRef.current.timeout);
        clickStateRef.current.timeout = null;
        clickStateRef.current.key = null;
      }
      setEliminatedOpts(prev => ({ ...prev, [key]: false }));
      return;
    }

    if (clickStateRef.current.timeout && clickStateRef.current.key === key) {
      // Double click detected on the SAME option -> Eliminate it
      clearTimeout(clickStateRef.current.timeout);
      clickStateRef.current.timeout = null;
      clickStateRef.current.key = null;
      setEliminatedOpts(prev => ({ ...prev, [key]: true }));
    } else {
      // If there's a pending click on ANOTHER option, trigger it immediately
      if (clickStateRef.current.timeout && clickStateRef.current.key && clickStateRef.current.key !== key) {
        clearTimeout(clickStateRef.current.timeout);
        setSelectedOpt(clickStateRef.current.key as OptionKey);
        onSelectOption(clickStateRef.current.key as OptionKey);
      }
      
      // Single click detected -> Wait to see if it's a double click
      clickStateRef.current.key = key;
      clickStateRef.current.timeout = setTimeout(() => {
        clickStateRef.current.timeout = null;
        clickStateRef.current.key = null;
        setSelectedOpt(key);
        onSelectOption(key);
      }, 250);
    }`;

code = code.replace(oldClickLogic, newClickLogic);
fs.writeFileSync('src/components/QuestionCard.tsx', code);
