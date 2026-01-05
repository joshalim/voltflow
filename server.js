
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, 'db_config.json');

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = 3085;
const HOST = '0.0.0.0';

let pgPool = null;

// Persistent Config Management
const saveDbConfig = (config) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('Database configuration saved to disk.');
  } catch (err) {
    console.error('Error saving database config:', err);
  }
};

const loadDbConfig = () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading database config from disk:', err);
  }
  return null;
};

// Initialize Postgres Schema
const initDbSchema = async (pool) => {
  try {
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
  } catch (err) {
    console.error('Failed to initialize schema:', err.message);
  }
};

// Handle Postgres Pool Lifecycle
const setupPgPool = (config) => {
  if (pgPool) {
    pgPool.end();
  }
  
  pgPool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.pass,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });

  pgPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    pgPool = null; // Reset pool on critical error
  });

  initDbSchema(pgPool);
  return pgPool;
};

// Auto-boot sequence
const savedConfig = loadDbConfig();
if (savedConfig && savedConfig.isEnabled) {
  console.log('Initializing database from saved configuration...');
  setupPgPool(savedConfig);
}

// API: Test & Persist Postgres Connection
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

    // If test is successful, persist this config and update live pool
    saveDbConfig(config);
    setupPgPool(config);

    res.json({ success: true, message: 'Connection Successful and Persisted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API: Load Data (Multi-device safe)
app.get('/api/db/load', async (req, res) => {
  if (!pgPool) {
    return res.status(200).json(null); // Return null so app initializes with defaults
  }
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
    return res.status(400).json({ error: 'Database not connected on server. Go to Security tab to configure.' });
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
  res.json({ 
    status: 'LISTENING', 
    port: PORT, 
    protocol: 'ocpp1.6j',
    dbConnected: !!pgPool
  });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`VoltFlow CMS @ http://${HOST}:${PORT}`);
  console.log(`OCPP Gateway available at ws://${HOST}:${PORT}/ocpp`);
});
