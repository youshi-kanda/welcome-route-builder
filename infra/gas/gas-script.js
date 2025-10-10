/**
 * ALSOK採用システム - Google Apps Script (Cloudflare Functions対応版)
 */

const SHEET_NAME = 'ALSOK応募者データ';
const LOG_SHEET_NAME = 'システムログ';

const COLUMN_MAPPING = {
    A: '応募日時', B: '応募者名', C: '電話番号', D: '応募経路',
    E: '年齢確認', F: '国籍確認', G: '過去の逮捕歴', H: '暴力団関係',
    I: '精神的な病気', J: 'アルコール依存症', K: '薬物依存症',
    L: '住居確認', M: '連絡先確認', N: '面接希望', O: '特記事項',
    P: '失格状況', Q: '総合結果', R: '完了時間', S: 'デバイス種別',
    T: 'IPアドレス', U: 'ユーザーエージェント', V: 'セッションID',
    W: 'リファラー', X: '画面解像度', Y: '言語設定', Z: 'タイムゾーン',
    AA: '備考'
};

/**
 * スプレッドシート開時のメニュー作成
 */
function onOpen() {
    try {
        const ui = SpreadsheetApp.getUi();
        ui.createMenu('🛡️ ALSOK採用システム')
            .addItem('🔧 初期設定実行', 'initializeSheets')
            .addItem('📤 テストデータ追加', 'addTestData')
            .addItem('📊 応募状況確認', 'showApplicationStatus')
            .addItem('🌐 WebアプリURL表示', 'showWebAppUrl')
            .addToUi();
    
        SpreadsheetApp.getActiveSpreadsheet().toast(
            '🛡️ ALSOK採用システムが準備完了しました', 
            'システム起動', 3
        );
    } catch (error) {
        console.error('メニュー作成エラー:', error);
    }
}

/**
 * 🆕 GETリクエスト処理（ステータス確認用）
 */
function doGet(e) {
    try {
        console.log('📨 GETリクエスト受信');
    
        const action = (e && e.parameter && e.parameter.action) || 'status';
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
        let responseData = {
            success: true,
            timestamp: formatDateTime(new Date()),
            webAppUrl: ScriptApp.getService().getUrl()
        };
    
        if (action === 'status') {
            const mainSheet = spreadsheet.getSheetByName(SHEET_NAME);
            const logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
      
            responseData.status = (mainSheet && logSheet) ? 'ready' : 'uninitialized';
            responseData.message = (mainSheet && logSheet) 
                ? 'GAS Web App is ready to receive data.'
                : 'Sheets are not fully initialized. Please run initialization.';
            responseData.isMainSheetInitialized = !!mainSheet;
            responseData.isLogSheetInitialized = !!logSheet;
            responseData.totalApplicants = mainSheet ? Math.max(mainSheet.getLastRow() - 1, 0) : 0;
      
            // ログ記録
            logActivity('ステータス確認', 'INFO', `状態: ${responseData.status}`);
      
        } else if (action === 'config') {
            responseData.sheetName = SHEET_NAME;
            responseData.logSheetName = LOG_SHEET_NAME;
            responseData.fieldsCount = Object.keys(COLUMN_MAPPING).length;
        } else {
            responseData.success = false;
            responseData.error = `Unknown action: ${action}`;
        }
    
        console.log('✅ GETレスポンス送信:', responseData.status);
        return createResponse(responseData);
    
    } catch (error) {
        console.error('❌ doGet エラー:', error);
        return createResponse({
            success: false,
            error: error.toString(),
            status: 'error'
        });
    }
}

/**
 * POSTリクエスト処理（面接データ受信用）
 */
function doPost(e) {
    try {
        console.log('📨 POSTリクエスト受信開始');
    
        // スプレッドシートとシートの確認
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let mainSheet = spreadsheet.getSheetByName(SHEET_NAME);
    
        if (!mainSheet) {
            console.log('🔧 メインシート自動作成');
            mainSheet = spreadsheet.insertSheet(SHEET_NAME);
            setupMainSheetHeaders(mainSheet);
        }
    
        // POSTデータの解析
        let interviewData;
        try {
            if (e && e.postData && e.postData.contents) {
                interviewData = JSON.parse(e.postData.contents);
            } else if (e && e.parameter && e.parameter.data) {
                interviewData = JSON.parse(e.parameter.data);
            } else {
                // テスト用データ
                interviewData = {
                    applicantName: 'ALSOK接続テスト',
                    phoneNumber: '03-0000-0000',
                    test: true
                };
            }
      
            console.log('📋 データ解析完了:', {
                applicantName: interviewData.applicantName,
                isTest: !!interviewData.test
            });
      
        } catch (parseError) {
            console.error('❌ データ解析エラー:', parseError);
            return createResponse({
                success: false,
                error: '面接データの形式が正しくありません',
                statusCode: 400
            });
        }
    
        // テスト接続の場合
        if (interviewData.test) {
            console.log('🧪 接続テスト実行');
            logActivity('接続テスト', 'INFO', 'Cloudflare Functionsからの接続確認');
            return createResponse({
                success: true,
                message: 'ALSOK採用システム接続成功',
                timestamp: formatDateTime(new Date()),
                testResult: 'PASS'
            });
        }
    
        // 必須データ検証
        if (!interviewData.applicantName || !interviewData.phoneNumber) {
            console.log('⚠️ 必須データ不足');
            return createResponse({
                success: false,
                error: '応募者名と電話番号は必須項目です',
                statusCode: 400
            });
        }
    
        // データ追加処理
        const rowNumber = addInterviewData(interviewData);
    
        // 成功ログ
        logActivity('面接データ登録成功', 'SUCCESS', 
            `行番号: ${rowNumber}, 応募者: ${interviewData.applicantName}`,
            interviewData.ipAddress || '',
            interviewData.sessionId || ''
        );
    
        console.log('✅ データ登録完了:', rowNumber);
        return createResponse({
            success: true,
            message: '面接データが正常に登録されました',
            rowNumber: rowNumber,
            applicantName: interviewData.applicantName,
            qualificationStatus: determineQualificationStatus(interviewData),
            timestamp: formatDateTime(new Date()),
            spreadsheetUrl: spreadsheet.getUrl()
        });
    
    } catch (error) {
        console.error('❌ システムエラー:', error);
        logActivity('システムエラー', 'ERROR', error.toString());
        return createResponse({
            success: false,
            error: 'システムエラーが発生しました: ' + error.toString(),
            statusCode: 500
        });
    }
}

/**
 * レスポンス作成（CORSはCloudflare Functionsが処理）
 */
function createResponse(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data, null, 2))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 初期化関数
 */
function initializeSheets() {
    try {
        console.log('🔧 ALSOK採用システム初期化開始');
    
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
        // メインシート作成
        let mainSheet = spreadsheet.getSheetByName(SHEET_NAME);
        if (!mainSheet) {
            mainSheet = spreadsheet.insertSheet(SHEET_NAME);
        }
    
        // ログシート作成
        let logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
        if (!logSheet) {
            logSheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
        }
    
        // ヘッダー設定
        setupMainSheetHeaders(mainSheet);
        setupLogSheetHeaders(logSheet);
    
        logActivity('システム初期化完了', 'SUCCESS');
    
        SpreadsheetApp.getUi().alert(`🎉 ALSOK採用システム初期化完了！

✅ 作成シート:
• ${SHEET_NAME}
• ${LOG_SHEET_NAME}

📋 面接項目: ${Object.keys(COLUMN_MAPPING).length}項目

🔗 Cloudflare Functions対応:
• doGet: ステータス確認対応
• doPost: 面接データ受信対応

次の手順:
1. デプロイ → 新しいデプロイ
2. Cloudflare Functionsでテスト確認`);
    
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        SpreadsheetApp.getUi().alert('❌ 初期化エラー:\n' + error.toString());
    }
}

/**
 * メインシートヘッダー設定
 */
function setupMainSheetHeaders(sheet) {
    const headers = Object.values(COLUMN_MAPPING);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
  
    headerRange.setBackground('#003DA5')
                        .setFontColor('white')
                        .setFontWeight('bold')
                        .setFontSize(10)
                        .setHorizontalAlignment('center');
  
    sheet.setColumnWidth(1, 140);  // 応募日時
    sheet.setColumnWidth(2, 120);  // 応募者名
    sheet.setColumnWidth(3, 130);  // 電話番号
  
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(4);
}

/**
 * ログシートヘッダー設定
 */
function setupLogSheetHeaders(logSheet) {
    const logHeaders = ['タイムスタンプ', 'レベル', 'アクション', '詳細', 'IPアドレス', 'セッションID'];
    const logRange = logSheet.getRange(1, 1, 1, logHeaders.length);
    logRange.setValues([logHeaders]);
  
    logRange.setBackground('#E60012')
                    .setFontColor('white')
                    .setFontWeight('bold');
  
    logSheet.setFrozenRows(1);
}

/**
 * 面接データ追加
 */
function addInterviewData(data) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
    if (!sheet) {
        sheet = spreadsheet.insertSheet(SHEET_NAME);
        setupMainSheetHeaders(sheet);
    }
  
    const now = new Date();
    const qualificationStatus = determineQualificationStatus(data);
  
    const rowData = [
        formatDateTime(now), // A: 応募日時
        data.applicantName || '', // B: 応募者名
        data.phoneNumber || '', // C: 電話番号
        data.applicationSource || 'AI面接チャットbot', // D: 応募経路
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
        qualificationStatus, // P: 失格状況
        determineOverallResult(qualificationStatus), // Q: 総合結果
        data.completionTime || formatDateTime(now), // R: 完了時間
        getDeviceType(data.userAgent), // S: デバイス種別
        data.ipAddress || '', // T: IPアドレス
        (data.userAgent || '').substring(0, 200), // U: ユーザーエージェント
        data.sessionId || '', // V: セッションID
        data.referrer || '', // W: リファラー
        data.screenResolution || '', // X: 画面解像度
        data.language || 'ja', // Y: 言語設定
        data.timezone || 'Asia/Tokyo', // Z: タイムゾーン
        `AI面接完了 - ${qualificationStatus}` // AA: 備考
    ];
  
    const newRowNumber = sheet.getLastRow() + 1;
    sheet.getRange(newRowNumber, 1, 1, rowData.length).setValues([rowData]);
  
    return newRowNumber;
}

// ヘルパー関数群
function determineQualificationStatus(data) {
    if (data.step1_answer && data.step1_answer.includes('未満')) return '年齢不適格';
    if (data.step2_answer && !data.step2_answer.includes('日本')) return '国籍不適格';
    if (data.step3_answer && data.step3_answer.includes('あり')) return '前科あり';
    if (data.step4_answer && data.step4_answer.includes('あり')) return '暴力団関係';
  
    const healthIssues = [data.step5_answer, data.step6_answer, data.step7_answer];
    for (let answer of healthIssues) {
        if (answer && answer.includes('あり')) return 'その他不適格';
    }
    return '適格';
}

function determineOverallResult(qualificationStatus) {
    if (qualificationStatus === '適格') return '2次面接対象';
    if (qualificationStatus.includes('不適格') || qualificationStatus.includes('あり')) return '不採用';
    return '要検討';
}

function getDeviceType(userAgent) {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android')) return 'Mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
    return 'Desktop';
}

function formatDateTime(date) {
    return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
}

function logActivity(action, level = 'INFO', details = '', ipAddress = '', sessionId = '') {
    try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
    
        if (!logSheet) {
            logSheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
            setupLogSheetHeaders(logSheet);
        }
    
        const logData = [
            formatDateTime(new Date()),
            level,
            action,
            details.substring(0, 500),
            ipAddress,
            sessionId
        ];
    
        logSheet.appendRow(logData);
    
        if (logSheet.getLastRow() > 100) {
            logSheet.deleteRows(2, logSheet.getLastRow() - 100);
        }
    } catch (error) {
        console.error('ログ記録エラー:', error);
    }
}

function addTestData() {
    try {
        const testData = {
            applicantName: 'ALSOK太郎',
            phoneNumber: '03-1234-5678',
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
            step11_answer: '警備業務に興味があります',
            ipAddress: '203.0.113.100',
            sessionId: 'alsok_test_' + Date.now()
        };
    
        const rowNumber = addInterviewData(testData);
        logActivity('テストデータ追加', 'SUCCESS', 'ALSOK太郎のデータ追加');
    
        SpreadsheetApp.getUi().alert(`✅ テストデータ追加完了！

応募者: ALSOK太郎
行番号: ${rowNumber}
判定: 2次面接対象`);
    
    } catch (error) {
        SpreadsheetApp.getUi().alert('❌ テストデータエラー:\n' + error.toString());
    }
}

function showApplicationStatus() {
    try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
        if (!sheet) {
            SpreadsheetApp.getUi().alert('⚠️ データシートが存在しません。初期化を実行してください。');
            return;
        }
    
        const dataRows = Math.max(sheet.getLastRow() - 1, 0);
        SpreadsheetApp.getUi().alert(`📊 ALSOK採用システム状況

📋 総応募者数: ${dataRows} 名
📅 最終更新: ${formatDateTime(new Date())}
🔗 Cloudflare Functions: 連携済み`);
    
    } catch (error) {
        SpreadsheetApp.getUi().alert('❌ 状況確認エラー:\n' + error.toString());
    }
}
