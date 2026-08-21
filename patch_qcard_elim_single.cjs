const fs = require('fs');
let code = fs.readFileSync('src/components/QuestionCard.tsx', 'utf8');

const oldHandleOption = `  const handleOptionClick = (key: OptionKey) => {
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
      }, 250);
    }
  };`;

const newHandleOption = `  const handleOptionClick = (key: OptionKey) => {
    if (showFullResolution && mode === 'study') return;
    
    // If the option is already eliminated, a single click restores it immediately
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
    }
  };`;

code = code.replace(oldHandleOption, newHandleOption);
fs.writeFileSync('src/components/QuestionCard.tsx', code);
