/**
 * Google Apps Script (GAS) 連携ライブラリ
 * ALSOK採用システム専用
 */

class GASIntegration {
    constructor() {
        this.gasWebAppUrl = null;
        this.isEnabled = false;
        this.connectionStatus = 'disconnected';
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2秒
        
        // 設定読み込み
        this.loadConfiguration();
    }

    /**
     * 設定の読み込み
     */
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('gas_integration_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.gasWebAppUrl = config.webAppUrl;
                this.isEnabled = config.enabled !== false;
            }
            
            // 環境変数から読み込み（優先度高）
            if (typeof window !== 'undefined' && window.GAS_WEB_APP_URL) {
                this.gasWebAppUrl = window.GAS_WEB_APP_URL;
                this.isEnabled = true;
            }
            
            console.log('📊 GAS Integration設定:', {
                url: this.gasWebAppUrl ? this.maskUrl(this.gasWebAppUrl) : '未設定',
                enabled: this.isEnabled
            });
        } catch (error) {
            console.warn('⚠️ GAS設定読み込みエラー:', error);
        }
    }

    /**
     * 設定の保存
     */
    saveConfiguration(webAppUrl, enabled = true) {
        try {
            const config = {
                webAppUrl: webAppUrl?.trim(),
                enabled: enabled,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('gas_integration_config', JSON.stringify(config));
            
            this.gasWebAppUrl = config.webAppUrl;
            this.isEnabled = config.enabled;
            
            console.log('💾 GAS設定保存完了');
            return true;
        } catch (error) {
            console.error('❌ GAS設定保存エラー:', error);
            return false;
        }
    }

    /**
     * GAS Web App URLの検証
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
        if (!this.gasWebAppUrl) {
            return {
                success: false,
                message: 'Web App URLが設定されていません'
            };
        }
        
        this.updateConnectionStatus('testing');
        
        try {
            const testData = this.createTestData();
            const result = await this.sendDataWithRetry(testData, 1);
            
            if (result.success) {
                this.updateConnectionStatus('connected');
                return {
                    success: true,
                    message: 'GAS連携テスト成功',
                    response: result.response
                };
            } else {
                this.updateConnectionStatus('error');
                return {
                    success: false,
                    message: 'GAS連携テスト失敗: ' + result.message
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
        
        if (!this.gasWebAppUrl) {
            console.warn('⚠️ GAS Web App URL未設定');
            return {
                success: false,
                message: 'GAS Web App URLが設定されていません'
            };
        }
        
        this.updateConnectionStatus('sending');
        
        try {
            // データフォーマット
            const formattedData = this.formatDataForGAS(applicantData);
            
            // 送信実行
            const result = await this.sendDataWithRetry(formattedData);
            
            if (result.success) {
                this.updateConnectionStatus('success');
                console.log('✅ GAS送信成功:', result.response);
                
                return {
                    success: true,
                    message: 'スプレッドシートに正常に送信されました',
                    response: result.response,
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
                console.log(`📤 GAS送信試行 ${attempt}/${retries}`);
                
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
     * GASへのHTTP POST送信
     */
    async sendToGAS(data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト
        
        try {
            const response = await fetch(this.gasWebAppUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseData = await response.json();
            return responseData;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('リクエストがタイムアウトしました');
            } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('ネットワーク接続エラー - GAS URLを確認してください');
            } else {
                throw error;
            }
        }
    }

    /**
     * 応募者データをGAS形式にフォーマット
     */
    formatDataForGAS(applicantData) {
        const responses = applicantData.responses || [];
        
        // 11ステップの回答を取得
        const stepAnswers = {};
        responses.forEach(response => {
            if (response.questionNumber) {
                stepAnswers[`step${response.questionNumber}_answer`] = response.answer;
            }
        });
        
        // GAS用データ構造
        return {
            // 基本情報
            applicantName: applicantData.name || '',
            phoneNumber: applicantData.phone || '',
            applicationSource: applicantData.source || 'モバイル応募',
            
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
                }) : '',
            
            // 技術情報
            deviceType: this.getDeviceType(),
            ipAddress: applicantData.ipAddress || '',
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
            completionTime: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
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
                url: this.gasWebAppUrl ? this.maskUrl(this.gasWebAppUrl) : null
            }
        });
        document.dispatchEvent(event);
        
        console.log('📊 GAS接続状態更新:', status);
    }

    /**
     * 現在の状態取得
     */
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            hasUrl: !!this.gasWebAppUrl,
            connectionStatus: this.connectionStatus,
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
        this.isEnabled = false;
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
            completionTime: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
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
    if (config.webAppUrl) {
        gasIntegration.saveConfiguration(config.webAppUrl, config.enabled);
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