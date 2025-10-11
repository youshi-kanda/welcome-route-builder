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
    AB: '備考'
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
        data.step6_answer || '', // J: Q6_意気込み・アピール
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
        `AI面接完了 - ${qualificationStatus}` // AB: 備考
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
