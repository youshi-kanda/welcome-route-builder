import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8085;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ALSOK Demo Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Phone: http://0.0.0.0:${PORT}/phone`);
  console.log(`🖥️  Admin: http://0.0.0.0:${PORT}/admin`);
  console.log(`📲 Mobile: http://0.0.0.0:${PORT}/mobile`);
});