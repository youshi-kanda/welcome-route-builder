import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8082;

// 静的ファイルの配信（distディレクトリから）
app.use(express.static(path.join(__dirname, 'dist')));

// SPAのための設定（すべてのルートをindex.htmlにリダイレクト）
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running on http://0.0.0.0:${PORT}`);
  console.log(`Demo system is ready for access!`);
});