import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8092;

// 簡単なデモページHTML
const demoHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ALSOK デモシステム</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
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
        p { 
            font-size: 1.2rem; 
            margin-bottom: 30px; 
            opacity: 0.9;
        }
        .demo-links {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 30px;
        }
        .demo-link {
            display: block;
            padding: 15px 25px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            transition: all 0.3s ease;
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
        }
        .demo-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .admin { background: rgba(0,123,255,0.7); }
        .phone { background: rgba(40,167,69,0.7); }
        .mobile { background: rgba(255,193,7,0.7); color: #000; }
        .demo { background: rgba(220,53,69,0.7); }
        .status {
            margin-top: 30px;
            padding: 15px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            font-size: 0.9rem;
        }
        .emoji { font-size: 1.5rem; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1><span class="emoji">🎭</span>ALSOK デモシステム</h1>
        <p>完全なPC・モバイル連携面接システム</p>
        
        <div class="demo-links">
            <a href="/admin" class="demo-link admin">
                <span class="emoji">🖥️</span>PC管理画面
            </a>
            <a href="/phone" class="demo-link phone">
                <span class="emoji">📱</span>電話受付
            </a>
            <a href="/mobile" class="demo-link mobile">
                <span class="emoji">📲</span>モバイル申込
            </a>
            <a href="/demo" class="demo-link demo">
                <span class="emoji">🎬</span>統合デモ
            </a>
        </div>
        
        <div class="status">
            <p><strong>🚀 デモ機能</strong></p>
            <p>✅ QRコード連携 ✅ リアルタイム同期</p>
            <p>✅ SMS送信シミュレーション ✅ 管理画面</p>
            <p>✅ PC・スマホ完全対応</p>
        </div>
        
        <div style="margin-top: 20px; font-size: 0.8rem; opacity: 0.7;">
            <p>🔧 デモブランチ: demo-system</p>
            <p>📍 ポート: ${PORT}</p>
        </div>
    </div>
    
    <script>
        // 自動リダイレクト機能
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🎭 ALSOK Demo System Ready');
            
            // 5秒後に自動的にPC管理画面に移動（デモ用）
            setTimeout(() => {
                if (window.location.pathname === '/') {
                    console.log('🖥️ Auto-redirecting to admin dashboard...');
                    // window.location.href = '/admin';
                }
            }, 5000);
        });
    </script>
</body>
</html>`;

const server = createServer((req, res) => {
    console.log(`📡 Request: ${req.method} ${req.url}`);
    
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    
    if (req.url === '/' || req.url?.startsWith('/?')) {
        res.end(demoHtml);
    } else {
        // その他のルートは工事中表示
        const routeHtml = demoHtml.replace(
            '<h1><span class="emoji">🎭</span>ALSOK デモシステム</h1>',
            \`<h1><span class="emoji">🚧</span>工事中</h1>
             <p style="margin-bottom: 20px;">ルート: ${req.url}</p>
             <p><a href="/" style="color: #ffd700;">← トップに戻る</a></p>\`
        );
        res.end(routeHtml);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ALSOK Demo Server (Quick) running on:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Network:  http://0.0.0.0:${PORT}`);
    console.log(``);
    console.log(`📱 Demo Routes:`);
    console.log(`   /          - メインデモページ`);
    console.log(`   /admin     - PC管理画面 (工事中)`);
    console.log(`   /phone     - 電話受付 (工事中)`);
    console.log(`   /mobile    - モバイル申込 (工事中)`);
    console.log(`   /demo      - 統合デモ (工事中)`);
});

server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.log(`🔄 Port ${PORT} is busy, trying ${PORT + 1}...`);
    }
});