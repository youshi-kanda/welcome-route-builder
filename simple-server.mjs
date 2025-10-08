import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8084;
const distPath = path.join(__dirname, 'dist');

// MIMEタイプのマッピング
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

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  // SPAの場合、存在しないファイルはindex.htmlにリダイレクト
  if (!fs.existsSync(filePath) && !req.url.includes('.')) {
    filePath = path.join(distPath, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // ファイルが存在しない場合はindex.htmlを返す
        fs.readFile(path.join(distPath, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Internal Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple HTTP server running on http://0.0.0.0:${PORT}`);
  console.log(`Demo system is ready for access!`);
});