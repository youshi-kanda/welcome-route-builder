import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3002;

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
    let filePath;
    
    // ワークフローデモを常に配信
    if (req.url === '/' || req.url.startsWith('/?') || !extname(req.url)) {
      filePath = join(__dirname, 'workflow-demo.html');
    } else {
      // その他の静的ファイルは dist から
      filePath = join(__dirname, 'dist', req.url);
    }
    
    const ext = extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'text/html';
    
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content, 'utf-8');
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      // ファイルが見つからない場合はワークフローデモを配信
      try {
        const indexPath = join(__dirname, 'workflow-demo.html');
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
  console.log(`🚀 ALSOK 完全ワークフロー体験デモ起動中: http://0.0.0.0:${PORT}`);
  console.log(`📋 完全な採用プロセスを一画面で体験できます`);
  console.log(`🔄 リアルタイム同期で管理者画面と応募者画面が連動します`);
  console.log(`📱 QRコード生成機能付きでモバイル体験も可能です`);
});