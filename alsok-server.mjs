import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3006;

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
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;
    
    let filePath;
    
    // ルーティング設定
    if (pathname === '/' || pathname === '/index') {
      // ルートアクセス時は管理画面にリダイレクト
      res.writeHead(302, { 'Location': '/admin' });
      res.end();
      return;
    } else if (pathname === '/admin') {
      // 管理者ダッシュボード（PC専用）
      filePath = join(__dirname, 'admin-dashboard.html');
    } else if (pathname === '/mobile') {
      // 応募者ホーム画面（スマホ/PC対応）
      filePath = join(__dirname, 'mobile-home.html');
    } else if (pathname === '/interview') {
      // セキュリティ業界専用スクリーニング画面
      filePath = join(__dirname, 'security-screening.html');
    } else if (pathname === '/completed') {
      // 面接完了画面
      filePath = join(__dirname, 'interview-completed.html');
    } else if (pathname === '/shared-storage.js') {
      // 共有ストレージライブラリ
      filePath = join(__dirname, 'shared-storage.js');
    } else if (pathname.startsWith('/dist/')) {
      // 静的ファイル（dist フォルダから）
      filePath = join(__dirname, pathname);
    } else {
      // その他のファイル（favicon.ico など）
      filePath = join(__dirname, pathname);
    }
    
    const ext = extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'text/html';
    
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content, 'utf-8');
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 404エラー - シンプルなエラーページを返す
      const notFoundHtml = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ページが見つかりません - ALSOK採用システム</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50 min-h-screen flex items-center justify-center">
            <div class="max-w-md mx-auto text-center p-8">
                <div class="text-6xl mb-4">🔍</div>
                <h1 class="text-2xl font-bold text-gray-800 mb-4">ページが見つかりません</h1>
                <p class="text-gray-600 mb-6">
                    お探しのページは存在しないか、<br>
                    移動または削除された可能性があります。
                </p>
                <div class="space-y-3">
                    <a href="/admin" class="block bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors">
                        🖥️ 管理者ダッシュボード
                    </a>
                    <a href="/mobile" class="block bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors">
                        📱 面接応募フォーム
                    </a>
                </div>
                <div class="mt-8 text-xs text-gray-500">
                    🛡️ ALSOK採用システム
                </div>
            </div>
        </body>
        </html>
      `;
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(notFoundHtml, 'utf-8');
    } else {
      // 500エラー
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>サーバーエラー - ALSOK採用システム</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-red-50 min-h-screen flex items-center justify-center">
            <div class="max-w-md mx-auto text-center p-8">
                <div class="text-6xl mb-4">⚠️</div>
                <h1 class="text-2xl font-bold text-red-800 mb-4">サーバーエラー</h1>
                <p class="text-red-600 mb-6">
                    申し訳ございません。<br>
                    一時的なエラーが発生しました。
                </p>
                <button onclick="window.location.reload()" class="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition-colors">
                    🔄 ページを再読み込み
                </button>
                <div class="mt-8 text-xs text-red-500">
                    🛡️ ALSOK採用システム
                </div>
            </div>
        </body>
        </html>
      `;
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(errorHtml, 'utf-8');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ALSOK採用システム起動完了`);
  console.log(`📍 サーバーURL: http://0.0.0.0:${PORT}`);
  console.log(`\n📋 利用可能なページ:`);
  console.log(`   🖥️  管理者ダッシュボード:     http://0.0.0.0:${PORT}/admin`);
  console.log(`   📱 応募者ホーム画面:        http://0.0.0.0:${PORT}/mobile`);
  console.log(`   🤖 AI面接システム:          http://0.0.0.0:${PORT}/interview?id=[応募者ID]`);
  console.log(`   ✅ 面接完了画面:            http://0.0.0.0:${PORT}/completed?id=[応募者ID]`);
  console.log(`\n🎯 デモ体験方法:`);
  console.log(`   1. 管理者画面でQRコードを確認`);
  console.log(`   2. スマートフォンでQRコードをスキャン`);
  console.log(`   3. 面接フォームに入力して面接開始`);
  console.log(`   4. 管理者画面でリアルタイム監視`);
  console.log(`   5. 面接完了後、結果確認`);
});