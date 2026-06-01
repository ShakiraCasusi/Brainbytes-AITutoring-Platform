const http = require('http');

const options = {
  host: 'localhost',
  // Legacy Docker mapping checked host port 4000 from inside the container.
  // port: process.env.PORT || 4000,
  port: process.env.PORT || 3000,
  // Legacy path before the API route was standardized.
  // path: '/health',
  path: '/api/health',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});

request.on('error', () => {
  process.exit(1);
});

request.end();
