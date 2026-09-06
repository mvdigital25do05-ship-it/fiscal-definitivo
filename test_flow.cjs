const http = require('http');

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const s1 = await request('/api/questions/session/create', 'POST', {
    userId: 'test-user', filters: { volume: 'Constitucional', caderno: 'todos', topic: 'todos', order: 'aleatoria' }
  });
  const q1 = s1.session.questions[0];
  console.log('Q1 ID:', q1.id);
  
  await request('/api/questions/submit-answer', 'POST', {
    sessionId: s1.session.id,
    questionId: q1.id,
    selectedAnswer: 'a',
    mode: 'study',
    userId: 'test-user'
  });
  
  const s2 = await request('/api/questions/session/create', 'POST', {
    userId: 'test-user', filters: { volume: 'Tributário', caderno: 'todos', topic: 'todos', order: 'aleatoria' }
  });
  console.log('Switched to Tributário');
  
  const s3 = await request('/api/questions/session/create', 'POST', {
    userId: 'test-user', filters: { volume: 'Constitucional', caderno: 'todos', topic: 'todos', order: 'aleatoria' }
  });
  console.log('Switched back to Constitucional');
  
  const restoredQ1 = s3.session.questions.find(q => q.id === q1.id);
  console.log('Restored Q1 userAnswer:', restoredQ1.userAnswer);
  console.log('Session answers for Q1:', s3.session.answers[q1.id]);
}

run().catch(console.error);
