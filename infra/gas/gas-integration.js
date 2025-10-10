/**
 * Google Apps Script (GAS) Integration library (moved)
 * (moved from project root -> infra/gas/)
 */

// class and code copied from original root gas-integration.js (kept unchanged)
class GASIntegrationError extends Error {
    constructor(message, type = 'generic') {
        super(message);
        this.name = 'GASIntegrationError';
        this.type = type;
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
        this.apiEndpoint = '/api/alsok';
        this.gasWebAppUrl = null;
        this.isEnabled = true;
        this.connectionStatus = 'disconnected';
        this.maxRetries = 3;
        this.retryDelay = 2000;
        this.httpFetch = (typeof window !== 'undefined' && window.fetch) ? window.fetch.bind(window) : null;
        this.allowDemoPersist = false;
        this.loadConfiguration();
        this.checkSystemStatus();
    }

    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('gas_integration_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                if (config.apiEndpoint) {
                    this.apiEndpoint = config.apiEndpoint;
                }
                if (config.webAppUrl) {
                    this.gasWebAppUrl = config.webAppUrl;
                }
                this.isEnabled = config.enabled !== false;
                if (config.allowDemoPersist !== undefined) {
                    this.allowDemoPersist = !!config.allowDemoPersist;
                }
            }
            if (typeof window !== 'undefined') {
                if (window.ALSOK_API_ENDPOINT) {
                    this.apiEndpoint = window.ALSOK_API_ENDPOINT;
                }
                if (window.GAS_WEB_APP_URL) {
                    this.gasWebAppUrl = window.GAS_WEB_APP_URL;
                }
                if (window.ALSOK_ALLOW_DEMO_PERSIST) {
                    this.allowDemoPersist = true;
                }
            }
            console.log('\ud83d\udcca GAS Integration settings:', {
                endpoint: this.apiEndpoint,
                legacyUrl: this.gasWebAppUrl ? this.maskUrl(this.gasWebAppUrl) : '未設定',
                enabled: this.isEnabled
            });
        } catch (error) {
            console.warn('\u26a0\ufe0f GAS設定読込エラー:', error);
        }
    }

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
            console.log('\ud83d\udcbe GAS設定保存完了');
            return true;
        } catch (error) {
            console.error('\u274c GAS設定保存エラー:', error);
            return false;
        }
    }

    async checkSystemStatus() {
        try {
            console.log('\ud83d\udd27 ALSOK system status check...');
            const response = await fetch(`${this.apiEndpoint}?action=status`);
            const data = await response.json();
            if (data.success && data.status === 'ready') {
                this.updateConnectionStatus('connected');
                console.log('\u2705 ALSOK system ready');
                return true;
            } else {
                this.updateConnectionStatus('error');
                console.warn('\u26a0\ufe0f system preparing:', data.message);
                return false;
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            console.error('\u274c system check error:', error);
            return false;
        }
    }

    validateWebAppUrl(url) {
        const errors = [];
        if (!url || url.trim() === '') {
            errors.push('Web App URLが必要です');
            return { isValid: false, errors };
        }
        const gasUrlPattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9-_]+\/exec$/;
        if (!gasUrlPattern.test(url)) {
            errors.push('正しいGoogle Apps Script Web App URLの形式ではありません');
            errors.push('形式例: https://script.google.com/macros/s/[ID]/exec');
        }
        return { isValid: errors.length === 0, errors };
    }

    async testConnection() {
        this.updateConnectionStatus('testing');
        try {
            const testData = { test: true };
            const result = await this.sendDataWithRetry(testData, 1);
            if (result.success && result.response?.testResult === 'PASS') {
                this.updateConnectionStatus('connected');
                return { success: true, message: 'ALSOK 接続成功', response: result.response };
            } else {
                this.updateConnectionStatus('error');
                return { success: false, message: 'ALSOK 接続失敗: ' + (result.message || 'Unknown') };
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            return { success: false, message: 'テスト接続エラー: ' + error.message };
        }
    }

    async submitApplicantData(applicantData) {
        if (!this.isEnabled) {
            return { success: false, message: 'GAS連携が無効になっています', skipped: true };
        }
        this.updateConnectionStatus('sending');
        try {
            const formattedData = await this.formatDataForGAS(applicantData);
            const result = await this.sendDataWithRetry(formattedData);
            if (result.success) {
                this.updateConnectionStatus('success');
                return { success: true, message: '送信完了', response: result.response, rowNumber: result.response?.rowNumber };
            } else {
                this.updateConnectionStatus('error');
                return { success: false, message: '送信失敗: ' + result.message };
            }
        } catch (error) {
            this.updateConnectionStatus('error');
            return { success: false, message: 'システムエラー: ' + error.message };
        }
    }

    async sendDataWithRetry(data, maxRetries = null) {
        const retries = maxRetries !== null ? maxRetries : this.maxRetries;
        let lastError = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await this.sendToGAS(data);
                if (response.success) {
                    return { success: true, response: response, attempt };
                } else {
                    lastError = response.error || response.message || 'Unknown';
                    if (attempt < retries) await this.sleep(this.retryDelay);
                }
            } catch (error) {
                lastError = error.message;
                if (attempt < retries) await this.sleep(this.retryDelay);
            }
        }
        return { success: false, message: `${retries}回の試行後も失敗: ${lastError}` };
    }

    async sendToGAS(data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
            const fetchFn = this.httpFetch || fetch;
            const response = await fetchFn(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new GASIntegrationError(`HTTP ${response.status}: ${response.statusText}`, 'http');
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            clearTimeout(timeoutId);
            const err = normalizeError(error);
            if (err.name === 'AbortError') throw new GASIntegrationError('リクエストがタイムアウトしました', 'timeout');
            if (err.message && err.message.includes('Failed to fetch')) throw new GASIntegrationError('ネットワーク接続エラー - システム管理者にお問い合わせください', 'network');
            if (err instanceof GASIntegrationError) throw err;
            throw new GASIntegrationError(err.message || '不明なエラー', 'generic');
        }
    }

    async formatDataForGAS(applicantData) {
        // Normalize different shapes of interview responses coming from various demo pages
        // Support: applicantData.responses (with questionNumber), applicantData.interview_responses (array), and fall back to any array-like field
        let responses = [];
        if (Array.isArray(applicantData.responses) && applicantData.responses.length) {
            responses = applicantData.responses;
        } else if (Array.isArray(applicantData.interview_responses) && applicantData.interview_responses.length) {
            responses = applicantData.interview_responses.map((r, idx) => ({
                questionNumber: r.questionNumber || idx + 1,
                question: r.question || r.questionText || r.question || '',
                answer: r.answer || r.response || r.text || ''
            }));
        } else if (Array.isArray(applicantData.interviewResponses) && applicantData.interviewResponses.length) {
            responses = applicantData.interviewResponses.map((r, idx) => ({
                questionNumber: r.questionNumber || idx + 1,
                question: r.question || r.questionText || '',
                answer: r.answer || r.response || r.text || ''
            }));
        } else if (Array.isArray(applicantData.responses)) {
            responses = applicantData.responses;
        }

        const stepAnswers = {};
        // Populate stepN_answer either from explicit questionNumber or by sequential index fallback
        responses.forEach((response, idx) => {
            const qNum = response.questionNumber || response.step || (idx + 1);
            const ans = response.answer || response.response || response.value || '';
            stepAnswers[`step${qNum}_answer`] = ans;
        });
        const ipAddress = await this.getUserIP();
        return {
            // tolerate multiple name/phone field names from different flows
            applicantName: applicantData.name || applicantData.fullName || applicantData.applicantName || '',
            phoneNumber: applicantData.phone || applicantData.phoneNumber || applicantData.tel || '',
            applicationSource: applicantData.source || 'AI面接chatbot',
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
            disqualificationStatus: applicantData.disqualificationStatus || '',
            overallResult: applicantData.overallResult || '面接実施予定',
            completionTime: applicantData.interviewCompletedAt ? new Date(applicantData.interviewCompletedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : new Date().toISOString(),
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

    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    createTestData() {
        return {
            applicantName: 'テスト太郎( GAS 接続テスト )',
            phoneNumber: '090-0000-TEST',
            applicationSource: 'GAS接続テスト',
            step1_answer: '18歳以上です(テスト)',
            step2_answer: '日本国籍です(テスト)',
            step3_answer: 'ありません(テスト)',
            step4_answer: 'ありません(テスト)',
            step5_answer: 'ありません(テスト)',
            step6_answer: 'ありません(テスト)',
            step7_answer: 'ありません(テスト)',
            step8_answer: '東京都内在住(テスト)',
            step9_answer: '提供した番号で連絡可能(テスト)',
            step10_answer: 'はい、希望します(テスト)',
            step11_answer: '特にありません(テスト)',
            disqualificationStatus: '適格',
            overallResult: 'GAS接続テスト',
            completionTime: new Date().toISOString(),
            deviceType: this.getDeviceType(),
            ipAddress: 'TEST_IP',
            userAgent: navigator.userAgent,
            sessionId: 'test_session_' + Date.now(),
            referrer: document.referrer,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            notes: 'GAS接続テストデータ'
        };
    }

    updateConnectionStatus(status) {
        this.connectionStatus = status;
        const event = new CustomEvent('gasConnectionStatus', { detail: { status: status, timestamp: new Date().toISOString(), endpoint: this.apiEndpoint, url: this.gasWebAppUrl ? this.maskUrl(this.gasWebAppUrl) : null } });
        document.dispatchEvent(event);
        this.updateUI(status);
        console.log('\ud83d\udcca GAS connection status updated:', status);
    }

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
        const selectors = ['.gas-status', '[data-gas-status]', '#gas-status'];
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = statusInfo.text;
                element.style.color = statusInfo.color;
            });
        });
        if (status === 'connected' || status === 'success') { setGoogleSheetsStatus('✅ GAS経由で保存', '#28a745'); } else if (status === 'error') { setGoogleSheetsStatus('❌ 接続エラー', '#dc3545'); } else if (status === 'testing' || status === 'sending') { setGoogleSheetsStatus('🔄 処理中', '#17a2b8'); } else { setGoogleSheetsStatus('⚠️ 未設定', '#6c757d'); }
    }

    getStatus() { return { isEnabled: this.isEnabled, hasUrl: !!this.apiEndpoint, connectionStatus: this.connectionStatus, endpoint: this.apiEndpoint, url: this.gasWebAppUrl ? this.maskUrl(this.gasWebAppUrl) : null }; }

    maskUrl(url) { if (!url) return null; try { const parts = url.split('/'); if (parts.length >= 6 && parts[5]) { const scriptId = parts[5]; const masked = scriptId.substring(0, 8) + '...' + scriptId.slice(-4); return url.replace(scriptId, masked); } } catch (error) { return url.substring(0, 30) + '...'; } return url; }

    getDeviceType() { const width = window.innerWidth; if (width <= 768) return 'Mobile'; if (width <= 1024) return 'Tablet'; return 'Desktop'; }

    generateSessionId() { return 'gas_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    resetConfiguration() { localStorage.removeItem('gas_integration_config'); this.gasWebAppUrl = null; this.apiEndpoint = '/api/alsok'; this.isEnabled = true; this.connectionStatus = 'disconnected'; console.log('🗑️ GAS設定をリセットしました'); }

    async sendDemoData(count = 1) {
        const results = [];
        for (let i = 0; i < count; i++) {
            const demoData = this.createDemoData(i + 1);
            const result = await this.sendDataWithRetry(demoData);
            results.push(result);
            if (this.isSafeToPersist()) {
                try {
                    const fetchFn = this.httpFetch || fetch;
                    await fetchFn(this.apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(demoData) });
                } catch (e) {
                    try { const failed = JSON.parse(localStorage.getItem('gas_demo_persist_failed') || '[]'); failed.push({ data: demoData, error: String(e), at: new Date().toISOString() }); localStorage.setItem('gas_demo_persist_failed', JSON.stringify(failed)); } catch (le) {}
                }
            }
            if (i < count - 1) await this.sleep(1000);
        }
        return results;
    }

    createDemoData(index) {
        const names = ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美沙', '渡辺健太'];
        const name = names[(index - 1) % names.length];
        return {
            applicantName: `${name}(デモ${index})`,
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

    isSafeToPersist() {
        if (!this.allowDemoPersist) return false;
        try {
            const host = new URL(this.apiEndpoint, window.location.origin).host;
            if (host.includes('staging') || host.includes('dev') || host.includes('localhost')) return true;
        } catch (e) { return false; }
        return false;
    }
}

let gasIntegration = null;
function initializeGASIntegration(config = {}) { if (!gasIntegration) gasIntegration = new GASIntegration(); if (config.webAppUrl || config.apiEndpoint || config.enabled !== undefined) gasIntegration.saveConfiguration(config); return gasIntegration; }
async function submitToGAS(applicantData) { if (!gasIntegration) gasIntegration = new GASIntegration(); return await gasIntegration.submitApplicantData(applicantData); }
async function testGASConnection() { if (!gasIntegration) gasIntegration = new GASIntegration(); return await gasIntegration.testConnection(); }
function getGASStatus() { if (!gasIntegration) gasIntegration = new GASIntegration(); return gasIntegration.getStatus(); }

document.addEventListener('DOMContentLoaded', () => { console.log('🛡️ ALSOK system start...'); initializeGASIntegration(); });

window.ALSOK = { submit: submitToGAS, test: testGASConnection, status: getGASStatus, init: initializeGASIntegration };

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GASIntegration, initializeGASIntegration, submitToGAS, testGASConnection, getGASStatus };
}

function setGoogleSheetsStatus(text = '✅ GAS経由で保存', color = '#28a745') {
    const selectors = ['.gs-status', '[data-gs-status]', '#gs-status', '.google-sheets-status'];
    selectors.forEach(selector => { const elements = document.querySelectorAll(selector); elements.forEach(element => { element.textContent = text; element.style.color = color; }); });
}
