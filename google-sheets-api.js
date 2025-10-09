/**
 * Google Sheets API Integration for ALSOK Interview Demo System
 * Handles real-time data transmission to Google Spreadsheets
 */

class GoogleSheetsAPI {
    constructor() {
        this.API_KEY = null; // Will be set from environment or config
        this.SHEET_ID = null; // Will be set to target spreadsheet
        this.isAuthenticated = false;
        this.connectionStatus = 'disconnected';
        
        // Column mapping for ALSOK screening data
        this.columnMapping = {
            'A': 'timestamp', // 応募日時
            'B': 'applicantName', // 応募者名
            'C': 'phoneNumber', // 電話番号
            'D': 'applicationSource', // 応募経路
            'E': 'step1_answer', // 年齢確認
            'F': 'step2_answer', // 国籍確認
            'G': 'step3_answer', // 過去の逮捕歴
            'H': 'step4_answer', // 暴力団関係
            'I': 'step5_answer', // 精神的な病気
            'J': 'step6_answer', // アルコール依存症
            'K': 'step7_answer', // 薬物依存症
            'L': 'step8_answer', // 住居確認
            'M': 'step9_answer', // 連絡先確認
            'N': 'step10_answer', // 面接希望
            'O': 'step11_answer', // 特記事項
            'P': 'disqualificationStatus', // 失格状況
            'Q': 'overallResult', // 総合結果
            'R': 'completionTime', // 完了時間
            'S': 'deviceType', // デバイス種別
            'T': 'ipAddress', // IPアドレス
            'U': 'userAgent', // ユーザーエージェント
            'V': 'sessionId', // セッションID
            'W': 'referrer', // リファラー
            'X': 'screenResolution', // 画面解像度
            'Y': 'language', // 言語設定
            'Z': 'timezone', // タイムゾーン
            'AA': 'notes' // 備考
        };
    }

    /**
     * Initialize Google Sheets API with credentials
     */
    async initialize(config = {}) {
        try {
            // Load configuration from various sources
            this.API_KEY = config.apiKey || this.getFromStorage('google_sheets_api_key');
            this.SHEET_ID = config.sheetId || this.getFromStorage('google_sheets_sheet_id');
            
            if (!this.API_KEY || !this.SHEET_ID) {
                console.warn('Google Sheets API credentials not found. Using demo mode.');
                this.connectionStatus = 'demo_mode';
                return { success: false, message: 'Demo mode - credentials required for live integration' };
            }

            // Test connection to Google Sheets
            const testResult = await this.testConnection();
            if (testResult.success) {
                this.isAuthenticated = true;
                this.connectionStatus = 'connected';
                console.log('✅ Google Sheets API initialized successfully');
                return { success: true, message: 'Connected to Google Sheets' };
            } else {
                this.connectionStatus = 'error';
                return { success: false, message: testResult.message };
            }
        } catch (error) {
            console.error('❌ Google Sheets API initialization failed:', error);
            this.connectionStatus = 'error';
            return { success: false, message: error.message };
        }
    }

    /**
     * Test connection to Google Sheets API
     */
    async testConnection() {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}?key=${this.API_KEY}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Connected to spreadsheet:', data.properties.title);
                return { success: true, spreadsheet: data };
            } else {
                const errorData = await response.json();
                console.error('🚫 Google Sheets API error:', errorData);
                return { success: false, message: errorData.error?.message || 'Connection failed' };
            }
        } catch (error) {
            console.error('🚫 Network error testing Google Sheets connection:', error);
            return { success: false, message: 'Network error: ' + error.message };
        }
    }

    /**
     * Send applicant data to Google Sheets
     */
    async submitApplicantData(applicantData) {
        if (!this.isAuthenticated && this.connectionStatus !== 'demo_mode') {
            console.warn('📋 Google Sheets not authenticated - data saved locally only');
            return this.handleDemoMode(applicantData);
        }

        try {
            // Prepare row data based on column mapping
            const rowData = this.formatDataForSheets(applicantData);
            
            if (this.connectionStatus === 'demo_mode') {
                return this.handleDemoMode(applicantData, rowData);
            }

            // Send to Google Sheets using the Sheets API
            const result = await this.appendToSheet(rowData);
            
            if (result.success) {
                console.log('✅ Data successfully sent to Google Sheets');
                this.updateConnectionStatus('success');
                return {
                    success: true,
                    message: 'データがGoogle Spreadsheetsに送信されました',
                    sheetUrl: this.getSheetUrl(),
                    rowNumber: result.rowNumber
                };
            } else {
                console.error('❌ Failed to send data to Google Sheets:', result.error);
                this.updateConnectionStatus('error');
                return {
                    success: false,
                    message: 'スプレッドシートへの送信に失敗しました: ' + result.error
                };
            }
        } catch (error) {
            console.error('❌ Error submitting to Google Sheets:', error);
            this.updateConnectionStatus('error');
            return {
                success: false,
                message: 'システムエラー: ' + error.message
            };
        }
    }

    /**
     * Format applicant data for Google Sheets row
     */
    formatDataForSheets(data) {
        const now = new Date();
        const timestamp = now.toLocaleString('ja-JP', { 
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return [
            timestamp, // A: 応募日時
            data.applicantName || '', // B: 応募者名
            data.phoneNumber || '', // C: 電話番号
            data.applicationSource || '', // D: 応募経路
            data.step1_answer || '', // E: 年齢確認
            data.step2_answer || '', // F: 国籍確認
            data.step3_answer || '', // G: 過去の逮捕歴
            data.step4_answer || '', // H: 暴力団関係
            data.step5_answer || '', // I: 精神的な病気
            data.step6_answer || '', // J: アルコール依存症
            data.step7_answer || '', // K: 薬物依存症
            data.step8_answer || '', // L: 住居確認
            data.step9_answer || '', // M: 連絡先確認
            data.step10_answer || '', // N: 面接希望
            data.step11_answer || '', // O: 特記事項
            data.disqualificationStatus || '', // P: 失格状況
            data.overallResult || '', // Q: 総合結果
            data.completionTime || '', // R: 完了時間
            this.getDeviceInfo(), // S: デバイス種別
            data.ipAddress || '', // T: IPアドレス
            navigator.userAgent, // U: ユーザーエージェント
            data.sessionId || this.generateSessionId(), // V: セッションID
            document.referrer || '', // W: リファラー
            `${screen.width}x${screen.height}`, // X: 画面解像度
            navigator.language || 'ja', // Y: 言語設定
            Intl.DateTimeFormat().resolvedOptions().timeZone, // Z: タイムゾーン
            data.notes || '' // AA: 備考
        ];
    }

    /**
     * Append data to Google Sheet using Sheets API
     */
    async appendToSheet(rowData) {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/Sheet1:append?valueInputOption=USER_ENTERED&key=${this.API_KEY}`;
            
            const requestBody = {
                values: [rowData]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    success: true,
                    rowNumber: result.updates?.updatedRows || 'Unknown'
                };
            } else {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.error?.message || 'Unknown error'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle demo mode when API is not configured
     */
    handleDemoMode(applicantData, rowData = null) {
        console.log('📋 Demo mode - simulating Google Sheets submission');
        console.log('Data that would be sent:', applicantData);
        if (rowData) {
            console.log('Formatted row data:', rowData);
        }
        
        // Store in localStorage for demo purposes
        const demoData = JSON.parse(localStorage.getItem('demo_sheets_data') || '[]');
        demoData.push({
            timestamp: new Date().toISOString(),
            data: applicantData,
            rowData: rowData
        });
        localStorage.setItem('demo_sheets_data', JSON.stringify(demoData));
        
        return {
            success: true,
            message: 'デモモード: データが一時的に保存されました',
            demo: true,
            demoSheetUrl: '#demo-sheet'
        };
    }

    /**
     * Get demo data for testing
     */
    getDemoData() {
        return JSON.parse(localStorage.getItem('demo_sheets_data') || '[]');
    }

    /**
     * Clear demo data
     */
    clearDemoData() {
        localStorage.removeItem('demo_sheets_data');
        console.log('📋 Demo data cleared');
    }

    /**
     * Update connection status and notify listeners
     */
    updateConnectionStatus(status) {
        this.connectionStatus = status;
        
        // Dispatch custom event for status updates
        const event = new CustomEvent('sheetsConnectionStatus', {
            detail: { status, timestamp: new Date().toISOString() }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current connection status
     */
    getConnectionStatus() {
        return {
            status: this.connectionStatus,
            isAuthenticated: this.isAuthenticated,
            hasCredentials: !!(this.API_KEY && this.SHEET_ID)
        };
    }

    /**
     * Get Google Sheet URL for viewing
     */
    getSheetUrl() {
        if (!this.SHEET_ID) return null;
        return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/edit`;
    }

    /**
     * Utility methods
     */
    getFromStorage(key) {
        return localStorage.getItem(key);
    }

    setToStorage(key, value) {
        localStorage.setItem(key, value);
    }

    getDeviceInfo() {
        const width = window.innerWidth;
        if (width <= 768) return 'Mobile';
        if (width <= 1024) return 'Tablet';
        return 'Desktop';
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Create headers for the Google Sheet
     */
    static getSheetHeaders() {
        return [
            '応募日時', '応募者名', '電話番号', '応募経路',
            '年齢確認', '国籍確認', '過去の逮捕歴', '暴力団関係',
            '精神的な病気', 'アルコール依存症', '薬物依存症', '住居確認',
            '連絡先確認', '面接希望', '特記事項', '失格状況',
            '総合結果', '完了時間', 'デバイス種別', 'IPアドレス',
            'ユーザーエージェント', 'セッションID', 'リファラー', '画面解像度',
            '言語設定', 'タイムゾーン', '備考'
        ];
    }
}

// Global instance
let googleSheetsAPI = null;

/**
 * Initialize Google Sheets API (call this on page load)
 */
async function initializeGoogleSheets(config = {}) {
    if (!googleSheetsAPI) {
        googleSheetsAPI = new GoogleSheetsAPI();
    }
    
    const result = await googleSheetsAPI.initialize(config);
    return result;
}

/**
 * Submit data to Google Sheets (call this when applicant completes screening)
 */
async function submitToGoogleSheets(applicantData) {
    if (!googleSheetsAPI) {
        console.warn('Google Sheets API not initialized');
        return { success: false, message: 'API not initialized' };
    }
    
    return await googleSheetsAPI.submitApplicantData(applicantData);
}

/**
 * Get connection status for UI updates
 */
function getGoogleSheetsStatus() {
    if (!googleSheetsAPI) {
        return { status: 'not_initialized', isAuthenticated: false, hasCredentials: false };
    }
    
    return googleSheetsAPI.getConnectionStatus();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GoogleSheetsAPI,
        initializeGoogleSheets,
        submitToGoogleSheets,
        getGoogleSheetsStatus
    };
}