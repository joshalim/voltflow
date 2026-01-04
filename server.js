
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3085;
const HOST = '0.0.0.0';

// InfluxDB Proxy Configuration
const INFLUX_HOST = '127.0.0.1';
const INFLUX_PORT = 8086;

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

/**
 * InfluxDB Proxy Middleware
 * Forwards frontend requests to the local InfluxDB instance.
 * This solves CORS and "localhost" resolution issues from the browser.
 */
app.all('/influx-proxy/*', (req, res) => {
  const targetPath = req.url.replace('/influx-proxy', '');
  
  const options = {
    hostname: INFLUX_HOST,
    port: INFLUX_PORT,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${INFLUX_HOST}:${INFLUX_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyReq, { end: true });

  proxyReq.on('error', (e) => {
    console.error(`InfluxDB Proxy Error: ${e.message}`);
    res.status(502).send('InfluxDB is not reachable on the server.');
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Always serve index.html for any request to handle React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`-----------------------------------------------`);
  console.log(`VoltFlow CMS is running on http://${HOST}:${PORT}`);
  console.log(`InfluxDB Proxy active: /influx-proxy -> http://${INFLUX_HOST}:${INFLUX_PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, 'dist')}`);
  console.log(`-----------------------------------------------`);
});
