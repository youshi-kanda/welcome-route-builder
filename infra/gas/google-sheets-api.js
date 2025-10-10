// Moved google-sheets-api.js (copied) - kept content
class GoogleSheetsAPI {
    constructor() {
        this.API_KEY = null;
        this.SHEET_ID = null;
        this.isAuthenticated = false;
        this.connectionStatus = 'disconnected';
        this.columnMapping = { 'A': 'timestamp' };
    }
    async initialize(config = {}) {
        this.API_KEY = config.apiKey || this.getFromStorage('google_sheets_api_key');
        this.SHEET_ID = config.sheetId || this.getFromStorage('google_sheets_sheet_id');
        if (!this.API_KEY || !this.SHEET_ID) { this.connectionStatus = 'demo_mode'; return { success: false, message: 'Demo mode - credentials required' }; }
        const testResult = await this.testConnection();
        if (testResult.success) { this.isAuthenticated = true; this.connectionStatus = 'connected'; return { success: true, message: 'Connected' }; }
        this.connectionStatus = 'error'; return { success: false, message: testResult.message };
    }
    async testConnection() {
        try { const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}?key=${this.API_KEY}`; const response = await fetch(url, { method: 'GET' }); if (response.ok) { const data = await response.json(); return { success: true, spreadsheet: data }; } else { const errorData = await response.json(); return { success: false, message: errorData.error?.message || 'Connection failed' }; } } catch (error) { return { success: false, message: 'Network error: ' + error.message }; }
    }
    async submitApplicantData(applicantData) { if (!this.isAuthenticated && this.connectionStatus !== 'demo_mode') return this.handleDemoMode(applicantData); try { const rowData = this.formatDataForSheets(applicantData); if (this.connectionStatus === 'demo_mode') return this.handleDemoMode(applicantData, rowData); const result = await this.appendToSheet(rowData); if (result.success) { this.updateConnectionStatus('success'); return { success: true, message: 'Sent', sheetUrl: this.getSheetUrl(), rowNumber: result.rowNumber }; } else { this.updateConnectionStatus('error'); return { success: false, message: result.error }; } } catch (error) { this.updateConnectionStatus('error'); return { success: false, message: error.message }; }
    }
    formatDataForSheets(data) { const now = new Date(); const timestamp = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }); return [ timestamp, data.applicantName || '', data.phoneNumber || '' ]; }
    async appendToSheet(rowData) { try { const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/Sheet1:append?valueInputOption=USER_ENTERED&key=${this.API_KEY}`; const requestBody = { values: [rowData] }; const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }); if (response.ok) { const result = await response.json(); return { success: true, rowNumber: result.updates?.updatedRows || 'Unknown' }; } else { const errorData = await response.json(); return { success: false, error: errorData.error?.message || 'Unknown error' }; } } catch (error) { return { success: false, error: error.message }; } }
    handleDemoMode(applicantData, rowData = null) { const demoData = JSON.parse(localStorage.getItem('demo_sheets_data') || '[]'); demoData.push({ timestamp: new Date().toISOString(), data: applicantData, rowData: rowData }); localStorage.setItem('demo_sheets_data', JSON.stringify(demoData)); return { success: true, message: 'Demo saved', demo: true, demoSheetUrl: '#demo-sheet' }; }
    getDemoData() { return JSON.parse(localStorage.getItem('demo_sheets_data') || '[]'); }
    clearDemoData() { localStorage.removeItem('demo_sheets_data'); }
    updateConnectionStatus(status) { this.connectionStatus = status; const event = new CustomEvent('sheetsConnectionStatus', { detail: { status, timestamp: new Date().toISOString() } }); document.dispatchEvent(event); }
    getConnectionStatus() { return { status: this.connectionStatus, isAuthenticated: this.isAuthenticated, hasCredentials: !!(this.API_KEY && this.SHEET_ID) }; }
    getSheetUrl() { if (!this.SHEET_ID) return null; return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/edit`; }
    getFromStorage(key) { return localStorage.getItem(key); }
    setToStorage(key, value) { localStorage.setItem(key, value); }
    getDeviceInfo() { const width = window.innerWidth; if (width <= 768) return 'Mobile'; if (width <= 1024) return 'Tablet'; return 'Desktop'; }
    generateSessionId() { return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
}

let googleSheetsAPI = null;
async function initializeGoogleSheets(config = {}) { if (!googleSheetsAPI) googleSheetsAPI = new GoogleSheetsAPI(); const result = await googleSheetsAPI.initialize(config); return result; }
async function submitToGoogleSheets(applicantData) { if (!googleSheetsAPI) { console.warn('Google Sheets API not initialized'); return { success: false, message: 'API not initialized' }; } return await googleSheetsAPI.submitApplicantData(applicantData); }
function getGoogleSheetsStatus() { if (!googleSheetsAPI) return { status: 'not_initialized', isAuthenticated: false, hasCredentials: false }; return googleSheetsAPI.getConnectionStatus(); }
if (typeof module !== 'undefined' && module.exports) { module.exports = { GoogleSheetsAPI, initializeGoogleSheets, submitToGoogleSheets, getGoogleSheetsStatus }; }
