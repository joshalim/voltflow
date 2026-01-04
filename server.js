
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3085;
const HOST = '0.0.0.0';

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

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
  console.log(`Serving files from: ${path.join(__dirname, 'dist')}`);
  console.log(`-----------------------------------------------`);
});
