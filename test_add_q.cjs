const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/questions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
});
req.write(JSON.stringify({
  id: "test-q-123",
  volume: "Test Volume",
  caderno: "Test Caderno",
  topic: "Test Topic",
  statement: "This is a test statement",
  options: { A: "1", B: "2" },
  answer: "A"
}));
req.end();
