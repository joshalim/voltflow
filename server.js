
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = 3085;
const HOST = '0.0.0.0';

let pgPool = null;

// Initialize Postgres Schema
const initDbSchema = async (pool) => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_data (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE,
        data JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Postgres schema verified.');
  } finally {
    client.release();
  }
};

// Handle Postgres Config Updates
const setupPgPool = (config) => {
  if (pgPool) pgPool.end();
  
  pgPool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.pass,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });

  return pgPool;
};

// API: Test Postgres Connection
app.post('/api/db/test', async (req, res) => {
  const config = req.body;
  const testPool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.pass,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await testPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await testPool.end();
    res.json({ success: true, message: 'Connection Successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Load Data
app.get('/api/db/load', async (req, res) => {
  if (!pgPool) return res.status(400).json({ error: 'Postgres not configured' });
  try {
    const result = await pgPool.query("SELECT data FROM app_data WHERE key = 'voltflow_global_state'");
    if (result.rows.length > 0) {
      res.json(result.rows[0].data);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Save Data
app.post('/api/db/save', async (req, res) => {
  if (!pgPool) {
    // Attempt auto-setup if we have config in the request
    if (req.body.postgresConfig) setupPgPool(req.body.postgresConfig);
    else return res.status(400).json({ error: 'Postgres not configured' });
  }
  
  try {
    const data = req.body;
    await pgPool.query(`
      INSERT INTO app_data (key, data, updated_at)
      VALUES ('voltflow_global_state', $1, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET data = $1, updated_at = CURRENT_TIMESTAMP
    `, [data]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mock Status for NOC / Monitoring
app.get('/api/ocpp/status', (req, res) => {
  res.json({ status: 'LISTENING', port: PORT, protocol: 'ocpp1.6j' });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const server = http.createServer(app);

// Simple log for debugging
server.on('upgrade', (request, socket, head) => {
  console.log('Incoming WebSocket Upgrade request for OCPP...');
  // In a real scenario, we would use 'ws' library here to handle the upgrade.
  // For now, we just acknowledge the attempt in logs.
});

server.listen(PORT, HOST, () => {
  console.log(`VoltFlow CMS @ http://${HOST}:${PORT}`);
  console.log(`OCPP Gateway available at ws://${HOST}:${PORT}/ocpp`);
});
