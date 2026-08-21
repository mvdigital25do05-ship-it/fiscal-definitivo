const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

const regex = /const currentAvailableTopics = React\.useMemo\(\(\) => \{/g;
const replacement = `const currentAvailableTopics = React.useMemo(() => {
    console.log('Computing topics:', { selectedVolume, selectedCaderno, topicsByVolumeCaderno });`;
code = code.replace(regex, replacement);

fs.writeFileSync('src/views/StudyView.tsx', code);
