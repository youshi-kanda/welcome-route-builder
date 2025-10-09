/**
 * クライアント向けデモ用設定ファイル
 * 実際のGASスプレッドシートと連携
 */

// クライアント向けデモ用のGAS Web App URL
window.CLIENT_DEMO_GAS_URL = 'https://script.google.com/macros/s/AKfycbyZchii9FU-zsSWw-oLrTNAUkAI4MU8sqlEInRyA0c5kpxvsYGbjf_TtWqNrQeaHXBv/exec';

// デモ用設定の自動適用
document.addEventListener('DOMContentLoaded', function() {
    // GAS連携を自動的に有効化
    if (typeof GASIntegration === 'function') {
        const gasIntegration = new GASIntegration({
            webAppUrl: window.CLIENT_DEMO_GAS_URL,
            enabled: true
        });
        
        console.log('🎯 クライアント向けデモ用GAS連携を有効化しました');
        console.log('📊 スプレッドシートURL:', window.CLIENT_DEMO_GAS_URL);
        
        // 自動接続テスト（オプション）
        if (window.location.pathname.includes('gas-demo') || window.location.pathname.includes('gas-setup')) {
            setTimeout(async () => {
                try {
                    const result = await testGASConnection();
                    if (result.success) {
                        console.log('✅ クライアント向けGAS接続確認完了');
                    }
                } catch (error) {
                    console.log('⚠️ GAS接続テストスキップ:', error.message);
                }
            }, 2000);
        }
    }
});

// クライアント向けデモ用の環境情報表示
console.log(`
🎯 ========== ALSOK採用システム - クライアント向けデモ ==========
📊 Google Apps Script URL: ${window.CLIENT_DEMO_GAS_URL.substring(0, 50)}...
🔗 このデモで送信されるデータは、実際のGoogleスプレッドシートに記録されます
📱 モバイル・PC両対応の応募者画面で動作確認が可能です
===============================================================
`);