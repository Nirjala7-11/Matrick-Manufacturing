import http from 'http';

/**
 * Healthcheck Script
 * Executed by Docker runtime to assess backend Express & Socket server viability.
 */
const port = process.env.PORT || 5000;

const options = {
  host: '127.0.0.1',
  port: port,
  path: '/api/health',
  timeout: 4000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    console.error(`[Docker Healthcheck] Failed with HTTP Status Code: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error(`[Docker Healthcheck] Error connecting to server: ${err.message}`);
  process.exit(1);
});

req.end();
