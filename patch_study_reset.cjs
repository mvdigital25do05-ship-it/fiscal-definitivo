const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

const oldResetCall = `    try {
      await api.resetUserStats(userId);
      setGlobalStats({`;

const newResetCall = `    try {
      await api.resetUserStats(userId, selectedVolume, selectedCaderno);
      setGlobalStats({`;

code = code.replace(oldResetCall, newResetCall);

const oldResetConfirm = `    const confirmed = window.confirm(
      'Tem certeza de que deseja zerar o desempenho geral? Todo o histórico de acertos e erros será apagado.'
    );`;

const newResetConfirm = `    const confirmed = window.confirm(
      'Tem certeza de que deseja zerar o desempenho deste caderno? Seu histórico de acertos e erros para ele será apagado e a ordem das questões será reembaralhada.'
    );`;

code = code.replace(oldResetConfirm, newResetConfirm);
code = code.replace(/'Erro ao zerar desempenho geral. Tente novamente.'/g, "'Erro ao zerar desempenho. Tente novamente.'");
code = code.replace(/title="Zerar estatísticas de desempenho geral"/g, 'title="Zerar estatísticas deste caderno"');
code = code.replace(/Zerar Desempenho/g, 'Zerar Caderno');

fs.writeFileSync('src/views/StudyView.tsx', code);
