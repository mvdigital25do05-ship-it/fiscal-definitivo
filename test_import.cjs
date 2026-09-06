const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/import/execute',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});
req.write(JSON.stringify({
  questions: [
    {
      "id": "CE-0001",
      "disciplina": "Conhecimentos Específicos",
      "topico": "Atividade prática do fiscal",
      "subtopico": "Formação da prova administrativa",
      "enunciado": "Durante uma fiscalização tributária de rotina...",
      "alternativas": {
        "A": "O auditor não pode lavrar...",
        "B": "A apreensão de documentos...",
        "C": "A recusa de exibição...",
        "D": "Os termos de fiscalização...",
        "E": "A prova colhida..."
      },
      "gabarito": "B",
      "comentario": "Nos termos da legislação...",
      "fundamento": "Arts. 142, 195 e 200..."
    }
  ],
  schemaVersion: "1.0",
  dataset: { name: "Test Import" }
}));
req.end();
