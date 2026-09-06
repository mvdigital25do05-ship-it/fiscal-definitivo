const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

const anchorNext = `  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };`;
const replaceNext = `  const handleNext = () => {
    if (currentIndex < total - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onUpdateSession({ ...session, currentIndex: newIndex });
    }
  };`;

const anchorPrev = `  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };`;
const replacePrev = `  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onUpdateSession({ ...session, currentIndex: newIndex });
    }
  };`;

const anchorMap = `            onSelectIndex={(idx) => setCurrentIndex(idx)}`;
const replaceMap = `            onSelectIndex={(idx) => {
              setCurrentIndex(idx);
              onUpdateSession({ ...session, currentIndex: idx });
            }}`;

code = code.replace(anchorNext, replaceNext).replace(anchorPrev, replacePrev).replace(anchorMap, replaceMap);
fs.writeFileSync('src/views/StudyView.tsx', code);
console.log('StudyView.tsx patched for currentIndex persistence');
