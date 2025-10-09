/**
 * Google Sheets Configuration for ALSOK Interview Demo System
 * Configuration settings and credential management
 */

class GoogleSheetsConfig {
    constructor() {
        this.defaultConfig = {
            // Demo spreadsheet settings
            demoSheetId: '1BvHPQ177-c-WSyEKnPpXKoNM7Aiq_Example', // Example ID for demo
            apiKey: '', // Will be set from environment or user input
            
            // Sheet configuration
            sheetName: 'ALSOK応募者データ',
            headerRow: 1,
            dataStartRow: 2,
            
            // API settings
            batchSize: 100,
            retryAttempts: 3,
            timeoutMs: 30000,
            
            // UI settings
            showConnectionStatus: true,
            autoSubmit: true,
            fallbackToLocal: true
        };
        
        this.currentConfig = { ...this.defaultConfig };
    }

    /**
     * Load configuration from localStorage or environment
     */
    loadConfig() {
        try {
            // Load from localStorage
            const savedConfig = localStorage.getItem('google_sheets_config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.currentConfig = { ...this.defaultConfig, ...parsed };
            }
            
            // Override with environment variables if available
            if (typeof window !== 'undefined' && window.GOOGLE_SHEETS_CONFIG) {
                this.currentConfig = { ...this.currentConfig, ...window.GOOGLE_SHEETS_CONFIG };
            }
            
            console.log('📋 Google Sheets configuration loaded:', this.currentConfig);
            return this.currentConfig;
        } catch (error) {
            console.warn('⚠️ Failed to load Google Sheets config:', error);
            return this.defaultConfig;
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfig(config) {
        try {
            this.currentConfig = { ...this.currentConfig, ...config };
            localStorage.setItem('google_sheets_config', JSON.stringify(this.currentConfig));
            console.log('💾 Google Sheets configuration saved');
            return true;
        } catch (error) {
            console.error('❌ Failed to save Google Sheets config:', error);
            return false;
        }
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.currentConfig };
    }

    /**
     * Set API credentials
     */
    setCredentials(apiKey, sheetId) {
        const credentials = {
            apiKey: apiKey?.trim() || '',
            sheetId: sheetId?.trim() || ''
        };
        
        this.saveConfig(credentials);
        
        // Also save to individual localStorage items for compatibility
        localStorage.setItem('google_sheets_api_key', credentials.apiKey);
        localStorage.setItem('google_sheets_sheet_id', credentials.sheetId);
        
        return credentials;
    }

    /**
     * Get credentials from storage
     */
    getCredentials() {
        return {
            apiKey: this.currentConfig.apiKey || localStorage.getItem('google_sheets_api_key') || '',
            sheetId: this.currentConfig.sheetId || localStorage.getItem('google_sheets_sheet_id') || ''
        };
    }

    /**
     * Validate credentials format
     */
    validateCredentials(apiKey, sheetId) {
        const errors = [];
        
        // Validate API key format
        if (!apiKey) {
            errors.push('API キーが必要です');
        } else if (!/^AIza[0-9A-Za-z-_]{35}$/.test(apiKey)) {
            errors.push('API キーの形式が正しくありません');
        }
        
        // Validate Sheet ID format
        if (!sheetId) {
            errors.push('スプレッドシート ID が必要です');
        } else if (!/^[a-zA-Z0-9-_]{44}$/.test(sheetId) && !/^[a-zA-Z0-9-_]{40,50}$/.test(sheetId)) {
            errors.push('スプレッドシート ID の形式が正しくありません');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Clear all configuration and credentials
     */
    clearConfig() {
        this.currentConfig = { ...this.defaultConfig };
        localStorage.removeItem('google_sheets_config');
        localStorage.removeItem('google_sheets_api_key');
        localStorage.removeItem('google_sheets_sheet_id');
        console.log('🗑️ Google Sheets configuration cleared');
    }

    /**
     * Get demo configuration for testing
     */
    getDemoConfig() {
        return {
            apiKey: 'AIzaSyDemoKeyForTestingPurposes123456789', // Demo key
            sheetId: '1BvHPQ177-c-WSyEKnPpXKoNM7Aiq_DemoSheet', // Demo sheet ID
            sheetName: 'ALSOK応募者データ（デモ）',
            demoMode: true
        };
    }

    /**
     * Create Google Sheets setup instructions
     */
    getSetupInstructions() {
        return {
            steps: [
                {
                    title: 'Google Cloud Console でプロジェクト作成',
                    description: 'https://console.cloud.google.com/ でプロジェクトを作成します',
                    details: [
                        '「プロジェクトを選択」→「新しいプロジェクト」をクリック',
                        'プロジェクト名を入力（例：ALSOK面接システム）',
                        '「作成」をクリック'
                    ]
                },
                {
                    title: 'Google Sheets API を有効化',
                    description: 'Google Sheets API を有効にします',
                    details: [
                        '左メニューから「APIとサービス」→「ライブラリ」',
                        '「Google Sheets API」を検索',
                        '「有効にする」をクリック'
                    ]
                },
                {
                    title: 'API キーを作成',
                    description: 'APIアクセス用のキーを生成します',
                    details: [
                        '「APIとサービス」→「認証情報」',
                        '「認証情報を作成」→「APIキー」',
                        'キーをコピーして保存'
                    ]
                },
                {
                    title: 'スプレッドシートを作成・共有',
                    description: 'データ保存用のスプレッドシートを準備します',
                    details: [
                        'Google Sheetsで新しいスプレッドシートを作成',
                        'URLから ID部分をコピー（/spreadsheets/d/[ここがID]/edit）',
                        '共有設定を「リンクを知っている全員」に変更'
                    ]
                }
            ],
            urls: {
                cloudConsole: 'https://console.cloud.google.com/',
                sheetsAPI: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
                newSheet: 'https://docs.google.com/spreadsheets/create'
            }
        };
    }
}

// Global configuration instance
const googleSheetsConfig = new GoogleSheetsConfig();

// Auto-load configuration on script load
googleSheetsConfig.loadConfig();

// Export for global access
window.GoogleSheetsConfig = GoogleSheetsConfig;
window.googleSheetsConfig = googleSheetsConfig;