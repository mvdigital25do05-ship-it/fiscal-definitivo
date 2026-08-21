const fs = require('fs');
let code = fs.readFileSync('src/views/SessionConfigView.tsx', 'utf8');

const regex2 = /const availableTopics = React\.useMemo\(\(\) => \{/g;
const replacement2 = `const availableTopics = React.useMemo(() => {
    console.log('SessionConfig Computing topics:', { volume, caderno, topicsByVolumeCaderno: meta.topicsByVolumeCaderno });`;
code = code.replace(regex2, replacement2);

fs.writeFileSync('src/views/SessionConfigView.tsx', code);
