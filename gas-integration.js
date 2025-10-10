/**
 * Google Apps Script (GAS) 連携ライブラリ - Cloudflare Functions対応版
 * ALSOK採用システム専用（CORS解決済み）
 */

// カスタムエラークラス
class GASIntegrationError extends Error {
    constructor(message, type = 'generic') {
        super(message);
        this.name = 'GASIntegrationError';
        this.type = type; // e.g. 'timeout','network','http','validation','environment'
    }
}

function normalizeError(error) {
    if (error instanceof Error) return error;
    try {
        return new Error(String(error));
    } catch (e) {
        return new Error('Unknown error');
    }
}

class GASIntegration {
    constructor() {
        // 新しいAPIエンドポイント（CORS解決済み）
        this.apiEndpoint = '/api/alsok';
        this.gasWebAppUrl = null; // 後方互換性のため保持
        this.isEnabled = true;
        this.connectionStatus = 'disconnected';
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2秒
        // fetch抽象化（テストで差し替え可能）
        this.httpFetch = (typeof window !== 'undefined' && window.fetch) ? window.fetch.bind(window) : null;
        // デモ永続化を許可するか（安全チェックのためにフラグ化）
        this.allowDemoPersist = false; // デフォルトは許可しない
        
        // 設定読み込み
        this.loadConfiguration();
        
        // システム状態確認
        this.checkSystemStatus();
    }

    /**
     * 設定の読み込み
     */
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('gas_integration_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                // 新しい設定があれば優先
                if (config.apiEndpoint) {
                    this.apiEndpoint = config.apiEndpoint;
                }
                // 旧設定も保持（後方互換性）
                if (config.webAppUrl) {
                    this.gasWebAppUrl = config.webAppUrl;
                }
                this.isEnabled = config.enabled !== false;
                // デモ永続化のフラグ
                if (config.allowDemoPersist !== undefined) {
                    this.allowDemoPersist = !!config.allowDemoPersist;
                }
            }
            
            // 環境変数から読み込み（最優先）
            if (typeof window !== 'undefined') {
                if (window.ALSOK_API_ENDPOINT) {
                    this.apiEndpoint = window.ALSOK_API_ENDPOINT;
                }
                if (window.GAS_WEB_APP_URL) {
                    this.gasWebAppUrl = window.GAS_WEB_APP_URL;
                }
                // グローバルでデモ永続化を許可する場合
                if (window.ALSOK_ALLOW_DEMO_PERSIST) {
                    this.allowDemoPersist = true;
                }
            }
            
            console.log('📊 GAS Integration設定:', {
                endpoint: this.apiEndpoint,
                legacyUrl: this.gasWebAppUrl ? this.maskUrl(this.gasWebAppUrl) : '未設定',
                enabled: this.isEnabled
            });
        } catch (error) {
            console.warn('⚠️ GAS設定読み込みエラー:', error);
        }
    }

    /**
     * 設定の保存
     */
    saveConfiguration(config = {}) {
        try {
            const newConfig = {
                apiEndpoint: config.apiEndpoint || this.apiEndpoint,
                webAppUrl: config.webAppUrl || this.gasWebAppUrl,
                enabled: config.enabled !== undefined ? config.enabled : this.isEnabled,
                allowDemoPersist: config.allowDemoPersist !== undefined ? !!config.allowDemoPersist : this.allowDemoPersist,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('gas_integration_config', JSON.stringify(newConfig));
            
            this.apiEndpoint = newConfig.apiEndpoint;
            this.gasWebAppUrl = newConfig.webAppUrl;
            this.isEnabled = newConfig.enabled;
            
            console.log('💾 GAS設定保存完了');
            return true;
        } catch (error) {
            console.error('❌ GAS設定保存エラー:', error);
            return false;
        }
    }

    /**
     * システム状態確認
     */
    async checkSystemStatus() {
        try {
            console.log('🔧 ALSOK採用システム状態確認...');
            
            const response = await fetch(`${this.apiEndpoint}?action=status`);
            const data = await response.json();
            
            if (data.success && data.status === 'ready') {
                this.updateConnectionStatus('connected');
                console.log('✅ ALSOK採用システム準備完了');
                console.log(`📊 現在の応募者数: ${data.totalApplicants || 0}名`);
                return true;
            } else {
                this.updateConnectionStatus('error');
                console.warn('⚠️ システム準備中:', data.message);
                return false;
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            console.error('❌ システム確認エラー:', error);
            return false;
        }
    }

    /**
     * GAS Web App URLの検証（後方互換性）
     */
    validateWebAppUrl(url) {
        const errors = [];
        
        if (!url || url.trim() === '') {
            errors.push('Web App URLが必要です');
            return { isValid: false, errors };
        }
        
        // Google Apps Script URLの形式チェック
        const gasUrlPattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9-_]+\/exec$/;
        if (!gasUrlPattern.test(url)) {
            errors.push('正しいGoogle Apps Script Web App URLの形式ではありません');
            errors.push('形式例: https://script.google.com/macros/s/[ID]/exec');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 接続テスト
     */
    async testConnection() {
        this.updateConnectionStatus('testing');
        
        try {
            const testData = { test: true };
            const result = await this.sendDataWithRetry(testData, 1);
            
            if (result.success && result.response?.testResult === 'PASS') {
                this.updateConnectionStatus('connected');
                return {
                    success: true,
                    message: 'ALSOK採用システム接続成功',
                    response: result.response
                };
            } else {
                this.updateConnectionStatus('error');
                return {
                    success: false,
                    message: 'ALSOK採用システム接続失敗: ' + (result.message || 'Unknown error')
                };
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            return {
                success: false,
                message: 'テスト接続エラー: ' + error.message
            };
        }
    }

    /**
     * 応募者データの送信（メイン関数）
     */
    async submitApplicantData(applicantData) {
        if (!this.isEnabled) {
            console.log('📋 GAS連携無効 - データは送信されません');
            return {
                success: false,
                message: 'GAS連携が無効になっています',
                skipped: true
            };
        }
        
        this.updateConnectionStatus('sending');
        
        try {
            // データフォーマット
            const formattedData = await this.formatDataForGAS(applicantData);
            
            // 送信実行
            const result = await this.sendDataWithRetry(formattedData);
            
            if (result.success) {
                this.updateConnectionStatus('success');
                console.log('✅ GAS送信成功:', result.response);
                
                return {
                    success: true,
                    message: 'スプレッドシートに正常に送信されました',
                    response: result.response,
                    rowNumber: result.response?.rowNumber,
                    qualificationStatus: result.response?.qualificationStatus,
                    spreadsheetUrl: result.response?.spreadsheetUrl
                };
            } else {
                this.updateConnectionStatus('error');
                console.error('❌ GAS送信失敗:', result.message);
                
                return {
                    success: false,
                    message: 'スプレッドシート送信に失敗しました: ' + result.message
                };
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            console.error('❌ GAS送信エラー:', error);
            
            return {
                success: false,
                message: 'システムエラー: ' + error.message
            };
        }
    }

    /**
     * リトライ機能付きデータ送信
     */
    async sendDataWithRetry(data, maxRetries = null) {
        const retries = maxRetries !== null ? maxRetries : this.maxRetries;
        let lastError = null;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`📤 GAS送信試行 ${attempt}/${retries} → ${this.apiEndpoint}`);
                
                const response = await this.sendToGAS(data);
                
                if (response.success) {
                    return {
                        success: true,
                        response: response,
                        attempt: attempt
                    };
                } else {
                    lastError = response.error || response.message || 'Unknown error';
                    if (attempt < retries) {
                        console.log(`⏳ リトライまで${this.retryDelay}ms待機...`);
                        await this.sleep(this.retryDelay);
                    }
                }
            } catch (error) {
                lastError = error.message;
                console.warn(`⚠️ 送信試行 ${attempt} 失敗:`, error.message);
                
                if (attempt < retries) {
                    await this.sleep(this.retryDelay);
                }
            }
        }
        
        return {
            success: false,
            message: `${retries}回の試行後も失敗: ${lastError}`
        };
    }

    /**
     * GASへのHTTP POST送信（Cloudflare Functions経由、CORS解決済み）
     */
    async sendToGAS(data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト
        
        try {
            const fetchFn = this.httpFetch || fetch;
            const response = await fetchFn(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new GASIntegrationError(`HTTP ${response.status}: ${response.statusText}`, 'http');
            }
            
            const responseData = await response.json();
            return responseData;
            
        } catch (error) {
            clearTimeout(timeoutId);
            const err = normalizeError(error);
            if (err.name === 'AbortError') {
                throw new GASIntegrationError('リクエストがタイムアウトしました', 'timeout');
            }
            if (err.message && err.message.includes('Failed to fetch')) {
                throw new GASIntegrationError('ネットワーク接続エラー - システム管理者にお問い合わせください', 'network');
            }
            // 既に GASIntegrationError の場合はそのまま投げる
            if (err instanceof GASIntegrationError) throw err;
            throw new GASIntegrationError(err.message || '不明なエラー', 'generic');
        }
    }

    /**
     * 応募者データをGAS形式にフォーマット
     */
    async formatDataForGAS(applicantData) {
        const responses = applicantData.responses || [];
        
        // 11ステップの回答を取得
        const stepAnswers = {};
        responses.forEach(response => {
            if (response.questionNumber) {
                stepAnswers[`step${response.questionNumber}_answer`] = response.answer;
            }
        });
        
        // IPアドレス取得（非同期）
        const ipAddress = await this.getUserIP();
        
        // GAS用データ構造
        return {
            // 基本情報
            applicantName: applicantData.name || '',
            phoneNumber: applicantData.phone || '',
            applicationSource: applicantData.source || 'AI面接チャットbot',
            
            // 11ステップの回答
            step1_answer: stepAnswers.step1_answer || '',
            step2_answer: stepAnswers.step2_answer || '',
            step3_answer: stepAnswers.step3_answer || '',
            step4_answer: stepAnswers.step4_answer || '',
            step5_answer: stepAnswers.step5_answer || '',
            step6_answer: stepAnswers.step6_answer || '',
            step7_answer: stepAnswers.step7_answer || '',
            step8_answer: stepAnswers.step8_answer || '',
            step9_answer: stepAnswers.step9_answer || '',
            step10_answer: stepAnswers.step10_answer || '',
            step11_answer: stepAnswers.step11_answer || '',
            
            // 結果情報
            disqualificationStatus: applicantData.disqualificationStatus || '',
            overallResult: applicantData.overallResult || '面接実施予定',
            completionTime: applicantData.interviewCompletedAt ? 
                new Date(applicantData.interviewCompletedAt).toLocaleString('ja-JP', {
                    timeZone: 'Asia/Tokyo'
                }) : new Date().toISOString(),
            
            // 技術情報
            deviceType: this.getDeviceType(),
            ipAddress: ipAddress,
            userAgent: navigator.userAgent || '',
            sessionId: applicantData.id || this.generateSessionId(),
            referrer: document.referrer || '',
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language || 'ja',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notes: '事前確認完了'
        };
    }

    /**
     * ユーザーIPアドレス取得（修正版）
     */
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown'; // 修正: 未定義変数参照を削除
        }
    }

    /**
     * テストデータの作成
     */
    createTestData() {
        return {
            applicantName: 'テスト太郎（GAS連携テスト）',
            phoneNumber: '090-0000-TEST',
            applicationSource: 'GAS連携テスト',
            step1_answer: '18歳以上です（テスト）',
            step2_answer: '日本国籍です（テスト）',
            step3_answer: 'ありません（テスト）',
            step4_answer: 'ありません（テスト）',
            step5_answer: 'ありません（テスト）',
            step6_answer: 'ありません（テスト）',
            step7_answer: 'ありません（テスト）',
            step8_answer: '東京都内在住（テスト）',
            step9_answer: '提供した番号で連絡可能（テスト）',
            step10_answer: 'はい、希望します（テスト）',
            step11_answer: '特にありません（テスト）',
            disqualificationStatus: '適格',
            overallResult: 'GAS連携テスト',
            completionTime: new Date().toISOString(),
            deviceType: this.getDeviceType(),
            ipAddress: 'TEST_IP',
            userAgent: navigator.userAgent,
            sessionId: 'test_session_' + Date.now(),
            referrer: document.referrer,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notes: 'GAS連携テストデータ'
        };
    }

    /**
     * 接続状態の更新
     */
    updateConnectionStatus(status) {
        this.connectionStatus = status;
        
        // カスタムイベントの発火
        const event = new CustomEvent('gasConnectionStatus', {
            detail: {
                status: status,
                timestamp: new Date().toISOString(),
                endpoint: this.apiEndpoint,
                url: this.gasWebAppUrl ? this.maskUrl(this.gasWebAppUrl) : null
            }
        });
        document.dispatchEvent(event);
        
        // UI更新
        this.updateUI(status);
        
        console.log('📊 GAS接続状態更新:', status);
    }

    /**
     * UI更新
     */
    /**
 * UI更新（修正版）
 */
    updateUI(status) {
        const statusMap = {
            'connected': { text: '✅ 設定済み', color: '#28a745' },
            'testing': { text: '🔄 テスト中', color: '#17a2b8' },
            'sending': { text: '📤 送信中', color: '#ffc107' },
            'success': { text: '✅ 送信完了', color: '#28a745' },
            'error': { text: '❌ エラー', color: '#dc3545' },
            'disconnected': { text: '⚠️ 未接続', color: '#6c757d' }
        };
        
        const statusInfo = statusMap[status] || statusMap['disconnected'];
        
        // GAS連携ステータスの更新
        const selectors = ['.gas-status', '[data-gas-status]', '#gas-status'];
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = statusInfo.text;
                element.style.color = statusInfo.color;
            });
        });

        // 🔧 修正: Google Sheetsステータスも状態に応じて更新
        if (status === 'connected' || status === 'success') {
            setGoogleSheetsStatus('✅ GAS経由で保存', '#28a745');
        } else if (status === 'error') {
            setGoogleSheetsStatus('❌ 接続エラー', '#dc3545');
        } else if (status === 'testing' || status === 'sending') {
            setGoogleSheetsStatus('🔄 処理中', '#17a2b8');
        } else {
            setGoogleSheetsStatus('⚠️ 未設定', '#6c757d');
        }
    }


    /**
     * 現在の状態取得
     */
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            hasUrl: !!this.apiEndpoint,
            connectionStatus: this.connectionStatus,
            endpoint: this.apiEndpoint,
            url: this.gasWebAppUrl ? this.maskUrl(this.gasWebAppUrl) : null
        };
    }

    /**
     * URLのマスク表示
     */
    maskUrl(url) {
        if (!url) return null;
        try {
            const parts = url.split('/');
            if (parts.length >= 6 && parts[5]) {
                const scriptId = parts[5];
                const masked = scriptId.substring(0, 8) + '...' + scriptId.slice(-4);
                return url.replace(scriptId, masked);
            }
        } catch (error) {
            return url.substring(0, 30) + '...';
        }
        return url;
    }

    /**
     * ユーティリティ関数
     */
    getDeviceType() {
        const width = window.innerWidth;
        if (width <= 768) return 'Mobile';
        if (width <= 1024) return 'Tablet';
        return 'Desktop';
    }

    generateSessionId() {
        return 'gas_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 設定のリセット
     */
    resetConfiguration() {
        localStorage.removeItem('gas_integration_config');
        this.gasWebAppUrl = null;
        this.apiEndpoint = '/api/alsok';
        this.isEnabled = true;
        this.connectionStatus = 'disconnected';
        console.log('🗑️ GAS設定をリセットしました');
    }

    /**
     * デモデータ送信（テスト用）
     */
    async sendDemoData(count = 1) {
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const demoData = this.createDemoData(i + 1);
            const result = await this.sendDataWithRetry(demoData);
            results.push(result);
            
            // オプション: デモデータを安全な場合のみ永続化（ステージング等）
            if (this.isSafeToPersist()) {
                try {
                    // fire-and-forget で永続化を試みる
                    const fetchFn = this.httpFetch || fetch;
                    await fetchFn(this.apiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(demoData)
                    });
                } catch (e) {
                    // 永続化失敗は localStorage に残す
                    try {
                        const failed = JSON.parse(localStorage.getItem('gas_demo_persist_failed') || '[]');
                        failed.push({ data: demoData, error: String(e), at: new Date().toISOString() });
                        localStorage.setItem('gas_demo_persist_failed', JSON.stringify(failed));
                    } catch (le) {
                        // ignore
                    }
                }
            }
            
            if (i < count - 1) {
                await this.sleep(1000); // 1秒間隔
            }
        }
        
        return results;
    }

    /**
     * デモデータ作成
     */
    createDemoData(index) {
        const names = ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美咲', '渡辺健太'];
        const name = names[(index - 1) % names.length];
        
        return {
            applicantName: `${name}（デモ${index}）`,
            phoneNumber: `090-DEMO-${String(1000 + index).padStart(4, '0')}`,
            applicationSource: 'GASデモ送信',
            step1_answer: '18歳以上です',
            step2_answer: '日本国籍です',
            step3_answer: 'ありません',
            step4_answer: 'ありません',
            step5_answer: 'ありません',
            step6_answer: 'ありません',
            step7_answer: 'ありません',
            step8_answer: '東京都内在住',
            step9_answer: '提供した番号で連絡可能',
            step10_answer: 'はい、希望します',
            step11_answer: '特にありません',
            disqualificationStatus: '適格',
            overallResult: '面接実施予定',
            completionTime: new Date().toISOString(),
            deviceType: this.getDeviceType(),
            ipAddress: `192.168.1.${100 + index}`,
            userAgent: navigator.userAgent,
            sessionId: `demo_${index}_${Date.now()}`,
            referrer: document.referrer,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notes: `GASデモデータ #${index}`
        };
    }

    // デモの永続化が安全かを判定する（デフォルトでは不可）
    isSafeToPersist() {
        // 明示的な許可がある場合のみ許可
        if (!this.allowDemoPersist) return false;

        // 追加チェック: エンドポイントが明示的にステージングらしい文字列を含むか
        try {
            const host = new URL(this.apiEndpoint, window.location.origin).host;
            // 例えば 'staging' や 'dev' を含むホスト名のみ許可
            if (host.includes('staging') || host.includes('dev') || host.includes('localhost')) {
                return true;
            }
        } catch (e) {
            // 解析失敗は不可とする
            return false;
        }

        return false;
    }
}

// グローバルインスタンス
let gasIntegration = null;

/**
 * GAS連携の初期化
 */
function initializeGASIntegration(config = {}) {
    if (!gasIntegration) {
        gasIntegration = new GASIntegration();
    }
    
    // 設定が提供された場合は保存
    if (config.webAppUrl || config.apiEndpoint || config.enabled !== undefined) {
        gasIntegration.saveConfiguration(config);
    }
    
    return gasIntegration;
}

/**
 * GASにデータ送信（簡易関数）
 */
async function submitToGAS(applicantData) {
    if (!gasIntegration) {
        gasIntegration = new GASIntegration();
    }
    
    return await gasIntegration.submitApplicantData(applicantData);
}

/**
 * GAS接続テスト（簡易関数）
 */
async function testGASConnection() {
    if (!gasIntegration) {
        gasIntegration = new GASIntegration();
    }
    
    return await gasIntegration.testConnection();
}

/**
 * GAS設定状態取得（簡易関数）
 */
function getGASStatus() {
    if (!gasIntegration) {
        gasIntegration = new GASIntegration();
    }
    
    return gasIntegration.getStatus();
}

// システム初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛡️ ALSOK採用システム起動中...');
    initializeGASIntegration();
});

// グローバルオブジェクトとして公開
window.ALSOK = {
    submit: submitToGAS,
    test: testGASConnection,
    status: getGASStatus,
    init: initializeGASIntegration
};

// モジュールエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GASIntegration,
        initializeGASIntegration,
        submitToGAS,
        testGASConnection,
        getGASStatus
    };
}

/**
 * Google Sheetsステータス表示の更新
 */
function setGoogleSheetsStatus(text = '✅ GAS経由で保存', color = '#28a745') {
    const selectors = ['.gs-status', '[data-gs-status]', '#gs-status', '.google-sheets-status'];
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.textContent = text;
            element.style.color = color;
        });
    });
}

