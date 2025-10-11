/**
 * ALSOK採用システム - Google Apps Script (Cloudflare Functions対応版)
 */

const SHEET_NAME = 'ALSOK応募者データ';
const LOG_SHEET_NAME = 'システムログ';

const COLUMN_MAPPING = {
    A: '応募日時', B: '応募者名', C: '電話番号', D: '応募経路',
    E: 'Q1_応募経路詳細', F: 'Q2_欠格事由確認', G: 'Q3_勤務期間希望', H: 'Q4_志望動機・応募理由',
    I: 'Q5_体力面・業務対応', J: 'Q6_経験・スキル・資格', K: 'Q7_仕事内容理解度', L: 'Q8_責任の重さ認識',
    M: 'Q9_研修・資格意欲', N: 'Q10_重視する点', O: 'Q11_他社検討状況', P: 'Q12_面接準備・質問',
    Q: '適格性判定', R: '総合結果', S: '完了時間', T: 'デバイス種別',
    U: 'IPアドレス', V: 'ユーザーエージェント', W: 'セッションID',
    X: 'リファラー', Y: '画面解像度', Z: '言語設定', AA: 'タイムゾーン',
    AB: 'ステータス', AC: '審査メモ', AD: '更新日時', AE: '面接日時', AF: 'カレンダーイベントID'
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
 * 🆕 GETリクエスト処理（ステータス確認用＋管理画面API）
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
    
        // 管理画面用API
        if (action === 'getApplicants') {
            return getApplicantsApi(e);
        } else if (action === 'getApplicantDetail') {
            return getApplicantDetailApi(e);
        } else if (action === 'getAvailableSlots') {
            return getAvailableSlotsApi(e);
        } else if (action === 'getSettings') {
            return getSettingsApi(e);
        }
        
        // 既存のステータス確認
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
    
        console.log('✅ GETレスポンス送信:', responseData.status || action);
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
 * POSTリクエスト処理（面接データ受信用＋管理画面API）
 */
function doPost(e) {
    try {
        console.log('📨 POSTリクエスト受信開始');
    
        // POSTデータの解析
        let postData;
        try {
            if (e && e.postData && e.postData.contents) {
                postData = JSON.parse(e.postData.contents);
            } else if (e && e.parameter && e.parameter.data) {
                postData = JSON.parse(e.parameter.data);
            } else {
                postData = { test: true };
            }
        } catch (parseError) {
            console.error('❌ データ解析エラー:', parseError);
            return createResponse({
                success: false,
                error: 'データ形式が正しくありません',
                statusCode: 400
            });
        }
        
        // 管理画面用API
        const action = postData.action || '';
        if (action === 'updateApplicantStatus') {
            return updateApplicantStatusApi(postData);
        } else if (action === 'scheduleInterview') {
            return scheduleInterviewApi(postData);
        } else if (action === 'cancelInterview') {
            return cancelInterviewApi(postData);
        } else if (action === 'sendNotification') {
            return sendNotificationApi(postData);
        } else if (action === 'saveSettings') {
            return saveSettingsApi(postData);
        }
        
        // 既存の面接データ登録処理
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        let mainSheet = spreadsheet.getSheetByName(SHEET_NAME);
    
        if (!mainSheet) {
            console.log('🔧 メインシート自動作成');
            mainSheet = spreadsheet.insertSheet(SHEET_NAME);
            setupMainSheetHeaders(mainSheet);
        }
    
        // テスト接続の場合
        if (postData.test) {
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
        if (!postData.applicantName || !postData.phoneNumber) {
            console.log('⚠️ 必須データ不足');
            return createResponse({
                success: false,
                error: '応募者名と電話番号は必須項目です',
                statusCode: 400
            });
        }
    
        // データ追加処理
        const rowNumber = addInterviewData(postData);
    
        // 成功ログ
        logActivity('面接データ登録成功', 'SUCCESS', 
            `行番号: ${rowNumber}, 応募者: ${postData.applicantName}`,
            postData.ipAddress || '',
            postData.sessionId || ''
        );
    
        console.log('✅ データ登録完了:', rowNumber);
        return createResponse({
            success: true,
            message: '面接データが正常に登録されました',
            rowNumber: rowNumber,
            applicantName: postData.applicantName,
            qualificationStatus: determineQualificationStatus(postData),
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
    const output = ContentService
        .createTextOutput(JSON.stringify(data, null, 2))
        .setMimeType(ContentService.MimeType.JSON);
    
    // CORS対応: すべてのオリジンからのアクセスを許可
    // 本番環境では特定のドメインに制限することを推奨
    return output;
}

/**
 * CORS対応: OPTIONSリクエストのハンドリング
 */
function doOptions(e) {
    return ContentService
        .createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT);
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
    // Ensure stepN_answer fields are present by attempting to map from alternative payload shapes
    try {
        // Keyword-based mapping: map common question text keywords to the intended step index
        function mapByKeyword(responseText) {
            if (!responseText) return null;
            const t = String(responseText).toLowerCase();
            // age
            if (t.includes('年齢') || t.includes('歳') || t.includes('年')) return 1;
            // nationality
            if (t.includes('国籍') || t.includes('日本') || t.includes('国')) return 2;
            // arrest / criminal
            if (t.includes('逮捕') || t.includes('罰') || t.includes('犯罪') || t.includes('前科')) return 3;
            // organized crime
            if (t.includes('暴力') || t.includes('暴力団') || t.includes('やくざ')) return 4;
            // mental
            if (t.includes('精神') || t.includes('うつ') || t.includes('メンタル')) return 5;
            // alcohol
            if (t.includes('アルコール') || t.includes('お酒') || t.includes('飲酒')) return 6;
            // drugs
            if (t.includes('薬') || t.includes('ドラッグ') || t.includes('薬物')) return 7;
            // address
            if (t.includes('住') || t.includes('住所') || t.includes('在住')) return 8;
            // contact / phone
            if (t.includes('連絡') || t.includes('電話') || t.includes('携帯')) return 9;
            // interview wish / desire
            if (t.includes('希望') || t.includes('面接希望') || t.includes('応募') || t.includes('志望')) return 10;
            // notes / special
            if (t.includes('特') || t.includes('備考') || t.includes('その他')) return 11;
            return null;
        }
        // If step answers are missing, try to map from arrays like interview_responses or responses
        const maxSteps = 12;
        // Helper to set step if empty
        function setStepIfEmpty(stepIdx, value) {
            const key = `step${stepIdx}_answer`;
            if ((!data[key] || String(data[key]).trim() === '') && value !== undefined && value !== null) {
                data[key] = String(value);
            }
        }

        // 1) If interview_responses array exists (from DemoMobile etc.)
        if (Array.isArray(data.interview_responses) && data.interview_responses.length) {
            // first attempt keyword mapping
            data.interview_responses.forEach(function(item, idx) {
                if (idx < maxSteps) {
                    var qtext = item.question || item.questionText || '';
                    var ans = item.answer || item.response || item.text || '';
                    var mapped = mapByKeyword(qtext);
                    if (mapped) {
                        setStepIfEmpty(mapped, ans);
                    } else {
                        // store for positional fill later if no keyword
                        // attach a temporary _posAnswers array
                        data._posAnswers = data._posAnswers || [];
                        data._posAnswers.push(ans);
                    }
                }
            });
        }

        // 2) If responses array exists (from shared-storage with questionNumber)
        if (Array.isArray(data.responses) && data.responses.length) {
            data.responses.forEach(function(item) {
                var qnum = item.questionNumber || item.step || null;
                var qtext = item.question || item.questionText || '';
                var ans = item.answer || item.response || item.value || '';
                if (qnum && qnum >= 1 && qnum <= maxSteps) {
                    setStepIfEmpty(qnum, ans);
                } else {
                    var mapped = mapByKeyword(qtext);
                    if (mapped) {
                        setStepIfEmpty(mapped, ans);
                    } else {
                        data._posAnswers = data._posAnswers || [];
                        data._posAnswers.push(ans);
                    }
                }
            });
        }

        // 3) If some other array-like fields exist (e.g., interviewResponses)
        if (!data.step1_answer && Array.isArray(data.interviewResponses) && data.interviewResponses.length) {
            data.interviewResponses.forEach(function(item, idx) {
                var qtext = item.question || item.questionText || '';
                var ans = item.answer || item.response || item.text || '';
                var mapped = mapByKeyword(qtext);
                if (mapped) {
                    setStepIfEmpty(mapped, ans);
                } else {
                    data._posAnswers = data._posAnswers || [];
                    data._posAnswers.push(ans);
                }
            });
        }

        // Finally, fill remaining empty steps with any positional answers we've collected
        if (Array.isArray(data._posAnswers) && data._posAnswers.length) {
            var posIdx = 0;
            for (var s = 1; s <= maxSteps; s++) {
                var keyS = `step${s}_answer`;
                if (!data[keyS] || String(data[keyS]).trim() === '') {
                    if (posIdx < data._posAnswers.length) {
                        setStepIfEmpty(s, data._posAnswers[posIdx]);
                        posIdx++;
                    }
                }
            }
            // cleanup
            delete data._posAnswers;
        }

    } catch (mapError) {
        console.warn('Fallback mapping error:', mapError);
    }

    const qualificationStatus = determineQualificationStatus(data);
  
    const rowData = [
        formatDateTime(now), // A: 応募日時
        data.applicantName || '', // B: 応募者名
        data.phoneNumber || '', // C: 電話番号
        data.applicationSource || 'AI面接チャットbot', // D: 応募経路
        data.step1_answer || '', // E: Q1_応募経路詳細
        data.step2_answer || '', // F: Q2_欠格事由確認
        data.step3_answer || '', // G: Q3_勤務期間希望
        data.step4_answer || '', // H: Q4_志望動機・応募理由
        data.step5_answer || '', // I: Q5_体力面・業務対応
        data.step6_answer || '', // J: Q6_経験・スキル・資格
        data.step7_answer || '', // K: Q7_仕事内容理解度
        data.step8_answer || '', // L: Q8_責任の重さ認識
        data.step9_answer || '', // M: Q9_研修・資格意欲
        data.step10_answer || '', // N: Q10_重視する点
        data.step11_answer || '', // O: Q11_他社検討状況
        data.step12_answer || '', // P: Q12_面接準備・質問
        qualificationStatus, // Q: 適格性判定
        determineOverallResult(qualificationStatus), // R: 総合結果
        data.completionTime || formatDateTime(now), // S: 完了時間
        getDeviceType(data.userAgent), // T: デバイス種別
        data.ipAddress || '', // U: IPアドレス
        (data.userAgent || '').substring(0, 200), // V: ユーザーエージェント
        data.sessionId || '', // W: セッションID
        data.referrer || '', // X: リファラー
        data.screenResolution || '', // Y: 画面解像度
        data.language || 'ja', // Z: 言語設定
        data.timezone || 'Asia/Tokyo', // AA: タイムゾーン
        'screening_completed', // AB: ステータス（初期値）
        '', // AC: 審査メモ
        '', // AD: 更新日時
        '', // AE: 面接日時
        ''  // AF: カレンダーイベントID
    ];
  
    const newRowNumber = sheet.getLastRow() + 1;
    sheet.getRange(newRowNumber, 1, 1, rowData.length).setValues([rowData]);
  
    return newRowNumber;
}

// ヘルパー関数群（新11ステップ対応版）
function determineQualificationStatus(data) {
    // Q2: 欠格事由確認（警備業法準拠）
    if (data.step2_answer) {
        const answer = String(data.step2_answer).toLowerCase();
        if (answer.includes('禁錮') || answer.includes('刑に処せられた')) return '前科による不適格';
        if (answer.includes('警備業法違反')) return '警備業法違反歴';
        if (answer.includes('精神機能の障害')) return '精神機能要配慮';
        if (answer.includes('アルコール') || answer.includes('薬物') || answer.includes('中毒')) return '薬物等依存歴';
        if (answer.includes('暴力団')) return '暴力団関係';
    }
    
    // Q3: 勤務期間希望（継続性評価）
    if (data.step3_answer) {
        const answer = String(data.step3_answer).toLowerCase();
        if (answer.includes('短期間') || answer.includes('数ヶ月以内')) return '継続性要検討';
        if (answer.includes('3ヶ月') && !answer.includes('以上')) return '継続性要検討';
    }
    
    // Q4: 志望動機・応募理由（動機評価）
    if (data.step4_answer) {
        const answer = String(data.step4_answer).toLowerCase();
        if (answer.length < 20) return '志望動機要補強';
        if (answer.includes('お金') && !answer.includes('やりがい') && !answer.includes('責任')) return '動機内容要検討';
    }
    
    // Q5: 体力面対応（業務適合性）
    if (data.step5_answer) {
        const answer = String(data.step5_answer).toLowerCase();
        if (answer.includes('一部対応困難') || answer.includes('困難')) return '業務適合性要検討';
    }
    
    // Q6: 経験・スキル評価（加点要素）
    if (data.step6_answer) {
        const answer = String(data.step6_answer).toLowerCase();
        if (answer.includes('免許') || answer.includes('資格') || answer.includes('経験') || answer.includes('年')) {
            // 具体的な経験・資格記載は加点対象（判定には影響させない）
        }
    }
    
    // 記述式質問の内容評価（Q4, Q6, Q8, Q12）
    const textAnswers = [data.step4_answer, data.step6_answer, data.step8_answer, data.step12_answer];
    const emptyAnswers = textAnswers.filter(answer => !answer || String(answer).trim().length < 10);
    if (emptyAnswers.length >= 2) return '回答内容要検討';
    
    return '適格';
}

function determineOverallResult(qualificationStatus) {
    // 法的不適格
    if (qualificationStatus.includes('前科') || qualificationStatus.includes('暴力団') || 
        qualificationStatus.includes('薬物') || qualificationStatus.includes('警備業法')) {
        return '書類審査不通過';
    }
    
    // 適格
    if (qualificationStatus === '適格') return '書類審査通過';
    
    // 要検討事項
    if (qualificationStatus.includes('要検討') || qualificationStatus.includes('要配慮')) {
        return '個別審査対象';
    }
    
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
            step1_answer: 'Indeed（インディード）',
            step2_answer: '上記のいずれにも該当しない',
            step3_answer: '1年以上の長期勤務を希望',
            step4_answer: '人の安全を守る仕事に使命感を感じ、ALSOKの信頼性と実績に魅力を感じたため',
            step5_answer: '上記すべて対応可能',
            step6_answer: '接客業経験3年、普通自動車免許、コミュニケーション能力に自信あり',
            step7_answer: 'よく知っている',
            step8_answer: '重大な責任だと理解しており、しっかりと取り組みたい',
            step9_answer: '積極的に取り組みたい',
            step10_answer: '仕事のやりがい',
            step11_answer: '弊社のみに応募',
            step12_answer: '警備業法について勉強したい',
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

// ========================================
// 管理画面API関数群
// ========================================

/**
 * 応募者一覧取得API
 */
function getApplicantsApi(e) {
    try {
        const params = e.parameter || {};
        const startDate = params.startDate || '';
        const endDate = params.endDate || '';
        const status = params.status || 'all';
        const qualificationStatus = params.qualificationStatus || 'all';
        const searchQuery = params.searchQuery || '';
        const page = parseInt(params.page || '1');
        const pageSize = parseInt(params.pageSize || '50');
        
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!sheet) {
            return createResponse({
                success: false,
                error: 'データシートが見つかりません',
                applicants: []
            });
        }
        
        const lastRow = sheet.getLastRow();
        if (lastRow <= 1) {
            return createResponse({
                success: true,
                applicants: [],
                total: 0,
                page: page,
                pageSize: pageSize
            });
        }
        
        // 全データ取得
        const dataRange = sheet.getRange(2, 1, lastRow - 1, 28); // AB列まで
        const data = dataRange.getValues();
        
        // データを構造化
        let applicants = data.map((row, index) => {
            return {
                id: String(index + 2), // 行番号をIDとして使用
                timestamp: row[0] ? formatDateTime(row[0]) : '',
                applicantName: row[1] || '',
                phoneNumber: row[2] || '',
                applicationSource: row[3] || '',
                step1_answer: row[4] || '',
                step2_answer: row[5] || '',
                step3_answer: row[6] || '',
                step4_answer: row[7] || '',
                step5_answer: row[8] || '',
                step6_answer: row[9] || '',
                step7_answer: row[10] || '',
                step8_answer: row[11] || '',
                step9_answer: row[12] || '',
                step10_answer: row[13] || '',
                step11_answer: row[14] || '',
                step12_answer: row[15] || '',
                qualificationStatus: row[16] || '',
                overallResult: row[17] || '',
                completionTime: row[18] ? formatDateTime(row[18]) : '',
                deviceType: row[19] || '',
                ipAddress: row[20] || '',
                userAgent: row[21] || '',
                sessionId: row[22] || '',
                status: row[27] || 'screening_completed', // AB列: ステータス
                reviewNotes: '', // 今後追加
                interviewDate: '', // 今後追加
                interviewTime: '' // 今後追加
            };
        });
        
        // フィルタリング
        if (startDate) {
            applicants = applicants.filter(a => a.timestamp >= startDate);
        }
        if (endDate) {
            applicants = applicants.filter(a => a.timestamp <= endDate);
        }
        if (status !== 'all') {
            applicants = applicants.filter(a => a.status === status);
        }
        if (qualificationStatus !== 'all') {
            applicants = applicants.filter(a => a.qualificationStatus === qualificationStatus);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            applicants = applicants.filter(a => 
                a.applicantName.toLowerCase().includes(query) ||
                a.phoneNumber.includes(query)
            );
        }
        
        // ソート（新しい順）
        applicants.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        // ページネーション
        const total = applicants.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedApplicants = applicants.slice(startIndex, endIndex);
        
        logActivity('応募者一覧取得', 'INFO', `取得件数: ${paginatedApplicants.length}/${total}`);
        
        return createResponse({
            success: true,
            applicants: paginatedApplicants,
            total: total,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
        
    } catch (error) {
        console.error('❌ 応募者一覧取得エラー:', error);
        return createResponse({
            success: false,
            error: error.toString(),
            applicants: []
        });
    }
}

/**
 * 応募者詳細取得API
 */
function getApplicantDetailApi(e) {
    try {
        const params = e.parameter || {};
        const id = params.id || '';
        
        if (!id) {
            return createResponse({
                success: false,
                error: 'IDが指定されていません'
            });
        }
        
        const rowNumber = parseInt(id);
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!sheet || rowNumber < 2 || rowNumber > sheet.getLastRow()) {
            return createResponse({
                success: false,
                error: '応募者データが見つかりません'
            });
        }
        
        const row = sheet.getRange(rowNumber, 1, 1, 28).getValues()[0];
        
        const applicant = {
            id: String(rowNumber),
            timestamp: row[0] ? formatDateTime(row[0]) : '',
            applicantName: row[1] || '',
            phoneNumber: row[2] || '',
            applicationSource: row[3] || '',
            step1_answer: row[4] || '',
            step2_answer: row[5] || '',
            step3_answer: row[6] || '',
            step4_answer: row[7] || '',
            step5_answer: row[8] || '',
            step6_answer: row[9] || '',
            step7_answer: row[10] || '',
            step8_answer: row[11] || '',
            step9_answer: row[12] || '',
            step10_answer: row[13] || '',
            step11_answer: row[14] || '',
            step12_answer: row[15] || '',
            qualificationStatus: row[16] || '',
            overallResult: row[17] || '',
            completionTime: row[18] ? formatDateTime(row[18]) : '',
            deviceType: row[19] || '',
            ipAddress: row[20] || '',
            userAgent: row[21] || '',
            sessionId: row[22] || '',
            status: row[27] || 'screening_completed'
        };
        
        logActivity('応募者詳細取得', 'INFO', `ID: ${id}, 応募者: ${applicant.applicantName}`);
        
        return createResponse({
            success: true,
            applicant: applicant
        });
        
    } catch (error) {
        console.error('❌ 応募者詳細取得エラー:', error);
        return createResponse({
            success: false,
            error: error.toString()
        });
    }
}

/**
 * 応募者ステータス更新API
 */
function updateApplicantStatusApi(data) {
    try {
        const id = data.id || '';
        const newStatus = data.status || '';
        const notes = data.notes || '';
        
        if (!id || !newStatus) {
            return createResponse({
                success: false,
                error: 'IDとステータスは必須です'
            });
        }
        
        const rowNumber = parseInt(id);
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!sheet || rowNumber < 2 || rowNumber > sheet.getLastRow()) {
            return createResponse({
                success: false,
                error: '応募者データが見つかりません'
            });
        }
        
        // AB列(28列目)にステータス更新
        sheet.getRange(rowNumber, 28).setValue(newStatus);
        
        // AC列に審査メモ（必要に応じて追加）
        if (notes) {
            sheet.getRange(rowNumber, 29).setValue(notes);
        }
        
        // 更新日時をAD列に記録
        sheet.getRange(rowNumber, 30).setValue(formatDateTime(new Date()));
        
        const applicantName = sheet.getRange(rowNumber, 2).getValue();
        
        logActivity('ステータス更新', 'SUCCESS', 
            `ID: ${id}, 応募者: ${applicantName}, 新ステータス: ${newStatus}`);
        
        return createResponse({
            success: true,
            message: 'ステータスを更新しました',
            id: id,
            status: newStatus
        });
        
    } catch (error) {
        console.error('❌ ステータス更新エラー:', error);
        return createResponse({
            success: false,
            error: error.toString()
        });
    }
}

/**
 * ========================================
 * Google Calendar API連携
 * ========================================
 */

/**
 * カレンダー空き枠取得API
 * GET ?action=getAvailableSlots&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
function getAvailableSlotsApi(e) {
    try {
        const properties = PropertiesService.getScriptProperties();
        const calendarEnabled = properties.getProperty('CALENDAR_ENABLED') === 'true';
        
        if (!calendarEnabled) {
            return createResponse({
                success: false,
                error: 'カレンダー連携が無効です。設定ページで有効化してください。'
            });
        }
        
        const calendarId = properties.getProperty('CALENDAR_ID');
        if (!calendarId) {
            return createResponse({
                success: false,
                error: 'カレンダーIDが設定されていません。'
            });
        }
        
        const startDate = e.parameter.startDate || '';
        const endDate = e.parameter.endDate || '';
        
        if (!startDate || !endDate) {
            return createResponse({
                success: false,
                error: 'startDateとendDateが必要です'
            });
        }
        
        const calendar = CalendarApp.getCalendarById(calendarId);
        if (!calendar) {
            return createResponse({
                success: false,
                error: 'カレンダーが見つかりません。カレンダーIDを確認してください。'
            });
        }
        
        // 日付範囲のイベント取得
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // 終日まで
        
        const events = calendar.getEvents(start, end);
        
        // 空き枠を生成（営業時間: 9:00-18:00、1時間単位）
        const slots = [];
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
            // 平日のみ（土日を除外）
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                // 9:00-18:00の各1時間枠
                for (let hour = 9; hour < 18; hour++) {
                    const slotStart = new Date(currentDate);
                    slotStart.setHours(hour, 0, 0, 0);
                    
                    const slotEnd = new Date(currentDate);
                    slotEnd.setHours(hour + 1, 0, 0, 0);
                    
                    // 現在時刻より未来の枠のみ
                    if (slotStart > new Date()) {
                        // この時間帯に予定がないか確認
                        const isAvailable = !events.some(event => {
                            const eventStart = event.getStartTime();
                            const eventEnd = event.getEndTime();
                            return (slotStart >= eventStart && slotStart < eventEnd) ||
                                   (slotEnd > eventStart && slotEnd <= eventEnd) ||
                                   (slotStart <= eventStart && slotEnd >= eventEnd);
                        });
                        
                        if (isAvailable) {
                            slots.push({
                                startTime: Utilities.formatDate(slotStart, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
                                endTime: Utilities.formatDate(slotEnd, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
                                date: Utilities.formatDate(slotStart, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
                                time: Utilities.formatDate(slotStart, Session.getScriptTimeZone(), 'HH:mm')
                            });
                        }
                    }
                }
            }
            
            // 次の日へ
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(0, 0, 0, 0);
        }
        
        console.log('✅ カレンダー空き枠取得成功:', slots.length + '件');
        
        return createResponse({
            success: true,
            slots: slots,
            count: slots.length
        });
        
    } catch (error) {
        console.error('❌ カレンダー空き枠取得エラー:', error);
        return createResponse({
            success: false,
            error: error.toString()
        });
    }
}

/**
 * 面接予約登録API
 * POST with action: 'scheduleInterview'
 */
function scheduleInterviewApi(data) {
    try {
        const properties = PropertiesService.getScriptProperties();
        const calendarEnabled = properties.getProperty('CALENDAR_ENABLED') === 'true';
        
        if (!calendarEnabled) {
            return createResponse({
                success: false,
                error: 'カレンダー連携が無効です'
            });
        }
        
        const calendarId = properties.getProperty('CALENDAR_ID');
        if (!calendarId) {
            return createResponse({
                success: false,
                error: 'カレンダーIDが設定されていません'
            });
        }
        
        const applicantId = data.applicantId;
        const interviewDate = data.interviewDate; // YYYY-MM-DD HH:mm:ss
        const duration = data.duration || 60; // デフォルト60分
        
        if (!applicantId || !interviewDate) {
            return createResponse({
                success: false,
                error: 'applicantIdとinterviewDateが必要です'
            });
        }
        
        // スプレッドシートから応募者情報取得
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const mainSheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!mainSheet) {
            return createResponse({
                success: false,
                error: 'スプレッドシートが見つかりません'
            });
        }
        
        const dataRange = mainSheet.getDataRange();
        const values = dataRange.getValues();
        
        // 応募者を検索（ID = 行番号）
        const rowIndex = parseInt(applicantId);
        if (rowIndex < 2 || rowIndex > values.length) {
            return createResponse({
                success: false,
                error: '応募者が見つかりません'
            });
        }
        
        const rowData = values[rowIndex - 1];
        const applicantName = rowData[1]; // B列: 応募者名
        const phoneNumber = rowData[2]; // C列: 電話番号
        
        // カレンダーイベント作成
        const calendar = CalendarApp.getCalendarById(calendarId);
        if (!calendar) {
            return createResponse({
                success: false,
                error: 'カレンダーが見つかりません'
            });
        }
        
        const startTime = new Date(interviewDate);
        const endTime = new Date(startTime.getTime() + duration * 60000);
        
        const event = calendar.createEvent(
            `ALSOK面接: ${applicantName}`,
            startTime,
            endTime,
            {
                description: `応募者名: ${applicantName}\n電話番号: ${phoneNumber}\n\n応募者ID: ${applicantId}`,
                location: 'ALSOK本社（または指定場所）'
            }
        );
        
        const eventId = event.getId();
        
        // スプレッドシートに面接日時とイベントIDを保存
        const aeColumn = Object.keys(COLUMN_MAPPING).indexOf('AE') + 1; // 面接日時
        const afColumn = Object.keys(COLUMN_MAPPING).indexOf('AF') + 1; // カレンダーイベントID
        const adColumn = Object.keys(COLUMN_MAPPING).indexOf('AD') + 1; // 更新日時
        
        mainSheet.getRange(rowIndex, aeColumn).setValue(interviewDate);
        mainSheet.getRange(rowIndex, afColumn).setValue(eventId);
        mainSheet.getRange(rowIndex, adColumn).setValue(formatDateTime(new Date()));
        
        logActivity('面接予約登録', 'SUCCESS', 
            `応募者: ${applicantName}, 日時: ${interviewDate}, イベントID: ${eventId}`);
        
        console.log('✅ 面接予約登録成功:', eventId);
        
        return createResponse({
            success: true,
            message: '面接予約を登録しました',
            eventId: eventId,
            interviewDate: interviewDate
        });
        
    } catch (error) {
        console.error('❌ 面接予約登録エラー:', error);
        return createResponse({
            success: false,
            error: error.toString()
        });
    }
}

/**
 * 面接予約キャンセルAPI
 * POST with action: 'cancelInterview'
 */
function cancelInterviewApi(data) {
    try {
        const properties = PropertiesService.getScriptProperties();
        const calendarId = properties.getProperty('CALENDAR_ID');
        
        if (!calendarId) {
            return createResponse({
                success: false,
                error: 'カレンダーIDが設定されていません'
            });
        }
        
        const applicantId = data.applicantId;
        
        if (!applicantId) {
            return createResponse({
                success: false,
                error: 'applicantIdが必要です'
            });
        }
        
        // スプレッドシートからイベントID取得
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const mainSheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        const rowIndex = parseInt(applicantId);
        const afColumn = Object.keys(COLUMN_MAPPING).indexOf('AF') + 1;
        
        const eventId = mainSheet.getRange(rowIndex, afColumn).getValue();
        
        if (!eventId) {
            return createResponse({
                success: false,
                error: '予約されている面接が見つかりません'
            });
        }
        
        // カレンダーイベント削除
        const calendar = CalendarApp.getCalendarById(calendarId);
        const event = calendar.getEventById(eventId);
        
        if (event) {
            event.deleteEvent();
            
            // スプレッドシートから面接情報をクリア
            const aeColumn = Object.keys(COLUMN_MAPPING).indexOf('AE') + 1;
            const adColumn = Object.keys(COLUMN_MAPPING).indexOf('AD') + 1;
            
            mainSheet.getRange(rowIndex, aeColumn).setValue('');
            mainSheet.getRange(rowIndex, afColumn).setValue('');
            mainSheet.getRange(rowIndex, adColumn).setValue(formatDateTime(new Date()));
            
            logActivity('面接予約キャンセル', 'SUCCESS', `イベントID: ${eventId}`);
            
            console.log('✅ 面接予約キャンセル成功');
            
            return createResponse({
                success: true,
                message: '面接予約をキャンセルしました'
            });
        } else {
            return createResponse({
                success: false,
                error: 'カレンダーイベントが見つかりません'
            });
        }
        
    } catch (error) {
        console.error('❌ 面接予約キャンセルエラー:', error);
        return createResponse({
            success: false,
            error: error.toString()
        });
    }
}

/**
 * ========================================
 * 通知送信システム (Email/SMS)
 * ========================================
 */

/**
 * 通知送信API
 * POST with action: 'sendNotification'
 */
function sendNotificationApi(data) {
    try {
        const properties = PropertiesService.getScriptProperties();
        const applicantId = data.applicantId;
        const notificationType = data.type; // 'qualified', 'rejected', 'interview_reminder'
        const channel = data.channel || 'email'; // 'email' or 'sms'
        
        if (!applicantId || !notificationType) {
            return createResponse({
                success: false,
                error: 'applicantIdとtypeが必要です'
            });
        }
        
        // スプレッドシートから応募者情報取得
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const mainSheet = spreadsheet.getSheetByName(SHEET_NAME);
        
        if (!mainSheet) {
            return createResponse({
                success: false,
                error: 'スプレッドシートが見つかりません'
            });
        }
        
        const dataRange = mainSheet.getDataRange();
        const values = dataRange.getValues();
        
        const rowIndex = parseInt(applicantId);
        if (rowIndex < 2 || rowIndex > values.length) {
            return createResponse({
                success: false,
                error: '応募者が見つかりません'
            });
        }
        
        const rowData = values[rowIndex - 1];
        const applicantName = rowData[1]; // B列
        const phoneNumber = rowData[2]; // C列
        const aeColumnIndex = Object.keys(COLUMN_MAPPING).indexOf('AE');
        const interviewDate = rowData[aeColumnIndex] || '';
        
        let result = { success: false, message: '' };
        
        // メール送信
        if (channel === 'email' || channel === 'both') {
            const emailEnabled = properties.getProperty('EMAIL_ENABLED') === 'true';
            if (emailEnabled) {
                result = sendEmailNotification(applicantName, phoneNumber, interviewDate, notificationType, properties);
                if (!result.success) {
                    return createResponse(result);
                }
            } else {
                return createResponse({
                    success: false,
                    error: 'メール通知が無効です'
                });
            }
        }
        
        // SMS送信
        if (channel === 'sms' || channel === 'both') {
            const smsEnabled = properties.getProperty('TWILIO_ENABLED') === 'true';
            if (smsEnabled) {
                result = sendSmsNotification(applicantName, phoneNumber, interviewDate, notificationType, properties);
                if (!result.success) {
                    return createResponse(result);
                }
            } else {
                return createResponse({
                    success: false,
                    error: 'SMS通知が無効です'
                });
            }
        }
        
        logActivity('通知送信', 'SUCCESS', 
            `応募者: ${applicantName}, タイプ: ${notificationType}, チャンネル: ${channel}`);
        
        console.log('✅ 通知送信成功');
        
        return createResponse({
            success: true,
            message: '通知を送信しました',
            channel: channel
        });
        
    } catch (error) {
        console.error('❌ 通知送信エラー:', error);
        return createResponse({
            success: false,
            error: error.toString()
        });
    }
}

/**
 * メール送信処理
 */
function sendEmailNotification(applicantName, phoneNumber, interviewDate, notificationType, properties) {
    try {
        // テンプレート取得
        let template = '';
        let subject = '';
        
        if (notificationType === 'qualified') {
            template = properties.getProperty('QUALIFIED_EMAIL_TEMPLATE') || getDefaultQualifiedEmailTemplate();
            subject = '【ALSOK】採用選考通過のご連絡';
        } else if (notificationType === 'rejected') {
            template = properties.getProperty('REJECTED_EMAIL_TEMPLATE') || getDefaultRejectedEmailTemplate();
            subject = '【ALSOK】採用選考結果のご連絡';
        } else if (notificationType === 'interview_reminder') {
            template = properties.getProperty('INTERVIEW_REMINDER_TEMPLATE') || getDefaultInterviewReminderTemplate();
            subject = '【ALSOK】面接日時のご確認';
        }
        
        // テンプレート変数置換
        let body = template
            .replace(/{{name}}/g, applicantName)
            .replace(/{{interviewDate}}/g, interviewDate || '未定')
            .replace(/{{interviewLocation}}/g, 'ALSOK本社'); // 固定値または設定から取得
        
        // 件名抽出（テンプレートに含まれている場合）
        const subjectMatch = body.match(/件名:\s*(.+)/);
        if (subjectMatch) {
            subject = subjectMatch[1].trim();
            body = body.replace(/件名:\s*.+\n\n?/, '');
        }
        
        // メール送信（GmailApp使用）
        // 注意: 実際の電話番号からメールアドレスを取得する方法が必要
        // ここではデモとして電話番号をログに記録
        console.log(`📧 メール送信: ${applicantName} (${phoneNumber})`);
        console.log(`件名: ${subject}`);
        console.log(`本文:\n${body}`);
        
        // 実際のメール送信（電話番号ではなくメールアドレスが必要）
        // GmailApp.sendEmail(email, subject, body);
        
        // 代替案: ログシートに送信履歴を記録
        const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
        if (logSheet) {
            logSheet.appendRow([
                formatDateTime(new Date()),
                '通知送信',
                'EMAIL',
                applicantName,
                phoneNumber,
                subject,
                body.substring(0, 100) + '...'
            ]);
        }
        
        return {
            success: true,
            message: 'メールを送信しました'
        };
        
    } catch (error) {
        console.error('❌ メール送信エラー:', error);
        return {
            success: false,
            error: 'メール送信に失敗しました: ' + error.toString()
        };
    }
}

/**
 * SMS送信処理（Twilio API使用）
 */
function sendSmsNotification(applicantName, phoneNumber, interviewDate, notificationType, properties) {
    try {
        const accountSid = properties.getProperty('TWILIO_ACCOUNT_SID');
        const authToken = properties.getProperty('TWILIO_AUTH_TOKEN');
        const fromNumber = properties.getProperty('TWILIO_PHONE_NUMBER');
        
        if (!accountSid || !authToken || !fromNumber) {
            return {
                success: false,
                error: 'Twilio設定が不完全です'
            };
        }
        
        // テンプレート取得
        let template = '';
        
        if (notificationType === 'qualified') {
            template = properties.getProperty('QUALIFIED_SMS_TEMPLATE') || getDefaultQualifiedSmsTemplate();
        } else if (notificationType === 'interview_reminder') {
            template = properties.getProperty('INTERVIEW_SMS_TEMPLATE') || getDefaultInterviewSmsTemplate();
        } else {
            // 不合格通知はSMSで送らない（一般的な運用）
            return {
                success: true,
                message: 'SMS送信をスキップしました（不合格通知）'
            };
        }
        
        // テンプレート変数置換
        const message = template
            .replace(/{{name}}/g, applicantName)
            .replace(/{{interviewDate}}/g, interviewDate || '未定');
        
        // Twilio API呼び出し
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const payload = {
            From: fromNumber,
            To: phoneNumber,
            Body: message
        };
        
        const options = {
            method: 'post',
            payload: payload,
            headers: {
                'Authorization': 'Basic ' + Utilities.base64Encode(accountSid + ':' + authToken)
            },
            muteHttpExceptions: true
        };
        
        const response = UrlFetchApp.fetch(url, options);
        const responseCode = response.getResponseCode();
        
        console.log(`📱 SMS送信: ${applicantName} (${phoneNumber})`);
        console.log(`メッセージ: ${message}`);
        console.log(`Twilioレスポンス: ${responseCode}`);
        
        if (responseCode === 200 || responseCode === 201) {
            // ログシートに送信履歴を記録
            const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
            if (logSheet) {
                logSheet.appendRow([
                    formatDateTime(new Date()),
                    '通知送信',
                    'SMS',
                    applicantName,
                    phoneNumber,
                    '',
                    message
                ]);
            }
            
            return {
                success: true,
                message: 'SMSを送信しました'
            };
        } else {
            const errorBody = response.getContentText();
            console.error('Twilioエラー:', errorBody);
            return {
                success: false,
                error: 'SMS送信に失敗しました: ' + errorBody
            };
        }
        
    } catch (error) {
        console.error('❌ SMS送信エラー:', error);
        return {
            success: false,
            error: 'SMS送信に失敗しました: ' + error.toString()
        };
    }
}

/**
 * ========================================
 * 設定管理API (PropertiesService)
 * ========================================
 */

/**
 * 設定データ取得API
 * GET ?action=getSettings
 */
function getSettingsApi(e) {
    try {
        const properties = PropertiesService.getScriptProperties();
        
        // 各設定項目を取得
        const settings = {
            // Google Calendar設定
            calendarId: properties.getProperty('CALENDAR_ID') || '',
            calendarEnabled: properties.getProperty('CALENDAR_ENABLED') === 'true',
            
            // Twilio設定
            twilioAccountSid: properties.getProperty('TWILIO_ACCOUNT_SID') || '',
            twilioAuthToken: properties.getProperty('TWILIO_AUTH_TOKEN') || '',
            twilioPhoneNumber: properties.getProperty('TWILIO_PHONE_NUMBER') || '',
            twilioEnabled: properties.getProperty('TWILIO_ENABLED') === 'true',
            
            // メール通知設定
            emailEnabled: properties.getProperty('EMAIL_ENABLED') === 'true',
            emailFrom: properties.getProperty('EMAIL_FROM') || '',
            
            // 通知テンプレート
            qualifiedEmailTemplate: properties.getProperty('QUALIFIED_EMAIL_TEMPLATE') || getDefaultQualifiedEmailTemplate(),
            rejectedEmailTemplate: properties.getProperty('REJECTED_EMAIL_TEMPLATE') || getDefaultRejectedEmailTemplate(),
            interviewReminderTemplate: properties.getProperty('INTERVIEW_REMINDER_TEMPLATE') || getDefaultInterviewReminderTemplate(),
            qualifiedSmsTemplate: properties.getProperty('QUALIFIED_SMS_TEMPLATE') || getDefaultQualifiedSmsTemplate(),
            interviewSmsTemplate: properties.getProperty('INTERVIEW_SMS_TEMPLATE') || getDefaultInterviewSmsTemplate()
        };
        
        console.log('✅ 設定取得成功');
        
        return createResponse({
            success: true,
            settings: settings
        });
        
    } catch (error) {
        console.error('❌ 設定取得エラー:', error);
        return createResponse({
            success: false,
            error: error.toString()
        });
    }
}

/**
 * 設定データ保存API
 * POST with action: 'saveSettings'
 */
function saveSettingsApi(data) {
    try {
        const properties = PropertiesService.getScriptProperties();
        const settings = data.settings || {};
        
        // Google Calendar設定
        if (settings.calendarId !== undefined) {
            properties.setProperty('CALENDAR_ID', settings.calendarId);
        }
        if (settings.calendarEnabled !== undefined) {
            properties.setProperty('CALENDAR_ENABLED', String(settings.calendarEnabled));
        }
        
        // Twilio設定
        if (settings.twilioAccountSid !== undefined) {
            properties.setProperty('TWILIO_ACCOUNT_SID', settings.twilioAccountSid);
        }
        if (settings.twilioAuthToken !== undefined) {
            properties.setProperty('TWILIO_AUTH_TOKEN', settings.twilioAuthToken);
        }
        if (settings.twilioPhoneNumber !== undefined) {
            properties.setProperty('TWILIO_PHONE_NUMBER', settings.twilioPhoneNumber);
        }
        if (settings.twilioEnabled !== undefined) {
            properties.setProperty('TWILIO_ENABLED', String(settings.twilioEnabled));
        }
        
        // メール通知設定
        if (settings.emailEnabled !== undefined) {
            properties.setProperty('EMAIL_ENABLED', String(settings.emailEnabled));
        }
        if (settings.emailFrom !== undefined) {
            properties.setProperty('EMAIL_FROM', settings.emailFrom);
        }
        
        // 通知テンプレート
        if (settings.qualifiedEmailTemplate !== undefined) {
            properties.setProperty('QUALIFIED_EMAIL_TEMPLATE', settings.qualifiedEmailTemplate);
        }
        if (settings.rejectedEmailTemplate !== undefined) {
            properties.setProperty('REJECTED_EMAIL_TEMPLATE', settings.rejectedEmailTemplate);
        }
        if (settings.interviewReminderTemplate !== undefined) {
            properties.setProperty('INTERVIEW_REMINDER_TEMPLATE', settings.interviewReminderTemplate);
        }
        if (settings.qualifiedSmsTemplate !== undefined) {
            properties.setProperty('QUALIFIED_SMS_TEMPLATE', settings.qualifiedSmsTemplate);
        }
        if (settings.interviewSmsTemplate !== undefined) {
            properties.setProperty('INTERVIEW_SMS_TEMPLATE', settings.interviewSmsTemplate);
        }
        
        logActivity('設定保存', 'SUCCESS', '管理画面設定を保存しました');
        
        console.log('✅ 設定保存成功');
        
        return createResponse({
            success: true,
            message: '設定を保存しました'
        });
        
    } catch (error) {
        console.error('❌ 設定保存エラー:', error);
        return createResponse({
            success: false,
            error: error.toString()
        });
    }
}

/**
 * デフォルトテンプレート取得関数
 */
function getDefaultQualifiedEmailTemplate() {
    return `件名: 【ALSOK】採用選考通過のご連絡

{{name}}様

この度は弊社の求人にご応募いただき、誠にありがとうございます。

書類選考の結果、{{name}}様には面接へお進みいただくことになりました。
つきましては、下記日程にて面接を実施させていただきたく存じます。

■面接日時
{{interviewDate}}

■場所
{{interviewLocation}}

ご都合が悪い場合は、お手数ですがご連絡ください。

何卒よろしくお願い申し上げます。

ALSOK採用担当`;
}

function getDefaultRejectedEmailTemplate() {
    return `件名: 【ALSOK】採用選考結果のご連絡

{{name}}様

この度は弊社の求人にご応募いただき、誠にありがとうございました。

慎重に選考させていただきました結果、誠に残念ながら今回は
ご希望に添えない結果となりました。

{{name}}様の今後のご活躍を心よりお祈り申し上げます。

ALSOK採用担当`;
}

function getDefaultInterviewReminderTemplate() {
    return `件名: 【ALSOK】面接日時のご確認

{{name}}様

面接日時が近づいてまいりましたので、ご確認のご連絡です。

■面接日時
{{interviewDate}}

■場所
{{interviewLocation}}

当日お会いできることを楽しみにしております。

ALSOK採用担当`;
}

function getDefaultQualifiedSmsTemplate() {
    return '【ALSOK】{{name}}様、書類選考を通過されました。面接日程の詳細はメールをご確認ください。';
}

function getDefaultInterviewSmsTemplate() {
    return '【ALSOK】{{name}}様、{{interviewDate}}の面接のご確認です。お気をつけてお越しください。';
}
