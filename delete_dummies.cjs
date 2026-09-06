const http = require('http');

const idsToDelete = ['test-q-123', 'trib-123456', 'trib-MISSINGE'];

idsToDelete.forEach(id => {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/questions/' + id,
    method: 'DELETE'
  }, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Deleted', id, 'Response:', res.statusCode, data));
  });
  req.end();
});
