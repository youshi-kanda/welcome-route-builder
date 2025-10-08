import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 8086;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  try {
    let filePath = join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);
    
    // For SPA routes (non-file requests), serve index.html
    if (!extname(filePath) && req.url !== '/') {
      filePath = join(__dirname, 'dist', 'index.html');
    }
    
    const ext = extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content, 'utf-8');
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file not found, serve index.html (for SPA routing)
      try {
        const indexPath = join(__dirname, 'dist', 'index.html');
        const content = await readFile(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      } catch (indexError) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found', 'utf-8');
      }
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error', 'utf-8');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ALSOK Demo Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Phone: http://0.0.0.0:${PORT}/phone`);
  console.log(`🖥️  Admin: http://0.0.0.0:${PORT}/admin`);
  console.log(`📲 Mobile: http://0.0.0.0:${PORT}/mobile`);
});