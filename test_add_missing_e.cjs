const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/questions',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});
req.write(JSON.stringify({
  id: `trib-MISSINGE`,
  version: 1,
  volume: 'Direito Tributário',
  topic: 'Crédito Tributário',
  subtopic: 'Lançamento',
  difficulty: 'media',
  type: 'lei_seca',
  status: 'revisada',
  statement: 'Test missing E',
  options: { A: 'A', B: 'B', C: 'C', D: 'D', E: '' },
  answer: 'A',
  explanation: 'Exp',
  legalBasis: 'LB',
  tags: ['Fiscal', 'Tributário'],
}));
req.end();
