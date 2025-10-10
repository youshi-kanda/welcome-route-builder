// Moved google-sheets-config.js (copied)
class GoogleSheetsConfig {
    constructor() {
        this.defaultConfig = { demoSheetId: '1BvHPQ177-c-WSyEKnPpXKoNM7Aiq_Example', apiKey: '', sheetName: 'ALSOK応募者データ', headerRow: 1 };
        this.currentConfig = { ...this.defaultConfig };
    }
    loadConfig() { try { const savedConfig = localStorage.getItem('google_sheets_config'); if (savedConfig) { const parsed = JSON.parse(savedConfig); this.currentConfig = { ...this.defaultConfig, ...parsed }; } if (typeof window !== 'undefined' && window.GOOGLE_SHEETS_CONFIG) { this.currentConfig = { ...this.currentConfig, ...window.GOOGLE_SHEETS_CONFIG }; } return this.currentConfig; } catch (error) { return this.defaultConfig; } }
    saveConfig(config) { try { this.currentConfig = { ...this.currentConfig, ...config }; localStorage.setItem('google_sheets_config', JSON.stringify(this.currentConfig)); localStorage.setItem('google_sheets_api_key', this.currentConfig.apiKey || ''); localStorage.setItem('google_sheets_sheet_id', this.currentConfig.sheetId || ''); return true; } catch (error) { return false; } }
    getConfig() { return { ...this.currentConfig }; }
    setCredentials(apiKey, sheetId) { const credentials = { apiKey: apiKey?.trim() || '', sheetId: sheetId?.trim() || '' }; this.saveConfig(credentials); localStorage.setItem('google_sheets_api_key', credentials.apiKey); localStorage.setItem('google_sheets_sheet_id', credentials.sheetId); return credentials; }
    getCredentials() { return { apiKey: this.currentConfig.apiKey || localStorage.getItem('google_sheets_api_key') || '', sheetId: this.currentConfig.sheetId || localStorage.getItem('google_sheets_sheet_id') || '' }; }
    validateCredentials(apiKey, sheetId) { const errors = []; if (!apiKey) errors.push('API キーが必要です'); else if (!/^AIza[0-9A-Za-z-_]{35}$/.test(apiKey)) errors.push('API キーの形式が正しくありません'); if (!sheetId) errors.push('スプレッドシート ID が必要です'); return { isValid: errors.length === 0, errors }; }
    clearConfig() { this.currentConfig = { ...this.defaultConfig }; localStorage.removeItem('google_sheets_config'); localStorage.removeItem('google_sheets_api_key'); localStorage.removeItem('google_sheets_sheet_id'); }
    getDemoConfig() { return { apiKey: 'AIzaSyDemoKeyForTestingPurposes123456789', sheetId: '1BvHPQ177-c-WSyEKnPpXKoNM7Aiq_DemoSheet', sheetName: 'ALSOK応募者データ(デモ)', demoMode: true }; }
}

const googleSheetsConfig = new GoogleSheetsConfig();
googleSheetsConfig.loadConfig();
window.GoogleSheetsConfig = GoogleSheetsConfig;
window.googleSheetsConfig = googleSheetsConfig;
