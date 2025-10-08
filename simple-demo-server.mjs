import { createServer } from 'http';

const PORT = 8092;

const createDemoPage = (title, route) => `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ALSOK Demo - ${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { 
            font-size: 2.5rem; 
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 30px 0;
        }
        .link {
            display: block;
            padding: 15px 20px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            transition: all 0.3s ease;
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.2);
        }
        .link:hover {
            transform: translateY(-2px);
            background: rgba(255,255,255,0.3);
        }
        .status {
            margin-top: 30px;
            padding: 15px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 ALSOK Demo - ${title}</h1>
        <p>Route: ${route}</p>
        
        <div class="links">
            <a href="/" class="link">🏠 ホーム</a>
            <a href="/admin" class="link">🖥️ PC管理画面</a>
            <a href="/phone" class="link">📱 電話受付</a>
            <a href="/mobile" class="link">📲 モバイル申込</a>
        </div>
        
        <div class="status">
            <p><strong>🚀 デモシステム稼働中</strong></p>
            <p>ポート: ${PORT} | ブランチ: demo-system</p>
            <p>✅ 基本表示 ✅ ルーティング ✅ レスポンシブ</p>
        </div>
    </div>
    
    <script>
        console.log('🎭 ALSOK Demo System Ready');
        console.log('Current route:', window.location.pathname);
    </script>
</body>
</html>`;

const server = createServer((req, res) => {
    console.log('Request:', req.method, req.url);
    
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    });
    
    let title, route;
    
    switch (req.url) {
        case '/':
            title = 'メインページ';
            route = '/';
            break;
        case '/admin':
            title = 'PC管理画面';
            route = '/admin';
            break;
        case '/phone':
            title = '電話受付画面';
            route = '/phone';
            break;
        case '/mobile':
            title = 'モバイル申込画面';
            route = '/mobile';
            break;
        default:
            title = '工事中';
            route = req.url;
    }
    
    res.end(createDemoPage(title, route));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 ALSOK Simple Demo Server running on:');
    console.log('   http://0.0.0.0:' + PORT);
    console.log('📱 Routes: /, /admin, /phone, /mobile');
});

server.on('error', (err) => {
    console.error('Server error:', err.message);
});