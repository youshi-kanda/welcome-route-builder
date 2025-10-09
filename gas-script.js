/**
 * ALSOK採用システム Google Apps Script (GAS) 連携スクリプト
 * 
 * このスクリプトをGoogle Apps Scriptエディタにコピー&ペーストしてください
 * 
 * 設定手順:
 * 1. Google Spreadsheetsで新しいスプレッドシートを作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このコードをコピー&ペースト
 * 4. デプロイ > 新しいデプロイ > ウェブアプリとして実行
 * 5. 生成されたURLを応募者システムに設定
 */

// スプレッドシートのシート名設定
const SHEET_NAME = 'ALSOK応募者データ';
const LOG_SHEET_NAME = 'システムログ';

// 列のマッピング定義（A列から始まる）
const COLUMN_MAPPING = {
  A: '応募日時',
  B: '応募者名', 
  C: '電話番号',
  D: '応募経路',
  E: '年齢確認',
  F: '国籍確認',
  G: '過去の逮捕歴',
  H: '暴力団関係',
  I: '精神的な病気',
  J: 'アルコール依存症',
  K: '薬物依存症',
  L: '住居確認',
  M: '連絡先確認',
  N: '面接希望',
  O: '特記事項',
  P: '失格状況',
  Q: '総合結果',
  R: '完了時間',
  S: 'デバイス種別',
  T: 'IPアドレス',
  U: 'ユーザーエージェント',
  V: 'セッションID',
  W: 'リファラー',
  X: '画面解像度',
  Y: '言語設定',
  Z: 'タイムゾーン',
  AA: '備考'
};

/**
 * 初期化: スプレッドシートのセットアップ
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('ALSOK採用システム')
    .addItem('初期設定実行', 'initializeSheets')
    .addItem('テストデータ追加', 'addTestData')
    .addItem('統計情報更新', 'updateStatistics')
    .addItem('データ検証実行', 'validateAllData')
    .addToUi();
  
  // 自動初期化
  initializeSheets();
}

/**
 * スプレッドシート初期化
 */
function initializeSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // メインデータシート作成
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
  
  // シートの保護とフォーマット設定
  formatMainSheet(mainSheet);
  formatLogSheet(logSheet);
  
  logActivity('システム初期化完了');
}

/**
 * メインシートのヘッダー設定
 */
function setupMainSheetHeaders(sheet) {
  const headers = Object.values(COLUMN_MAPPING);
  const range = sheet.getRange(1, 1, 1, headers.length);
  
  // ヘッダー行をクリアして設定
  sheet.getRange(1, 1, 1, sheet.getLastColumn()).clearContent();
  range.setValues([headers]);
  
  // ヘッダーのフォーマット設定
  range.setBackground('#0066CC')
       .setFontColor('white')
       .setFontWeight('bold')
       .setFontSize(10)
       .setWrap(true);
  
  // 列幅の調整
  sheet.setColumnWidth(1, 120); // 応募日時
  sheet.setColumnWidth(2, 100); // 応募者名
  sheet.setColumnWidth(3, 120); // 電話番号
  sheet.setColumnWidth(4, 80);  // 応募経路
  
  // 質問回答列(E-O)
  for(let i = 5; i <= 15; i++) {
    sheet.setColumnWidth(i, 150);
  }
  
  // システム情報列(P-AA)
  for(let i = 16; i <= 27; i++) {
    sheet.setColumnWidth(i, 100);
  }
  
  // ヘッダー行を固定
  sheet.setFrozenRows(1);
}

/**
 * ログシートのヘッダー設定
 */
function setupLogSheetHeaders(logSheet) {
  const logHeaders = ['タイムスタンプ', 'レベル', 'アクション', '詳細', 'IPアドレス', 'セッションID'];
  const logRange = logSheet.getRange(1, 1, 1, logHeaders.length);
  
  logSheet.getRange(1, 1, 1, logSheet.getLastColumn()).clearContent();
  logRange.setValues([logHeaders]);
  logRange.setBackground('#E60012')
          .setFontColor('white')
          .setFontWeight('bold');
  
  logSheet.setFrozenRows(1);
}

/**
 * メインシートのフォーマット設定
 */
function formatMainSheet(sheet) {
  // データ行の交互背景色
  const dataRange = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 27);
  dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
  
  // データ検証ルールの設定
  setupDataValidation(sheet);
  
  // 条件付き書式の設定
  setupConditionalFormatting(sheet);
}

/**
 * ログシートのフォーマット設定
 */
function formatLogSheet(logSheet) {
  // 列幅調整
  logSheet.setColumnWidth(1, 150); // タイムスタンプ
  logSheet.setColumnWidth(2, 60);  // レベル
  logSheet.setColumnWidth(3, 100); // アクション
  logSheet.setColumnWidth(4, 300); // 詳細
  logSheet.setColumnWidth(5, 120); // IPアドレス
  logSheet.setColumnWidth(6, 200); // セッションID
}

/**
 * データ検証ルールの設定
 */
function setupDataValidation(sheet) {
  // 失格状況列の選択肢設定
  const qualificationRange = sheet.getRange(2, 16, 1000, 1); // P列
  const qualificationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['適格', '年齢不適格', '国籍不適格', '前科あり', '暴力団関係', 'その他不適格'])
    .setAllowInvalid(false)
    .build();
  qualificationRange.setDataValidation(qualificationRule);
  
  // 総合結果列の選択肢設定
  const resultRange = sheet.getRange(2, 17, 1000, 1); // Q列
  const resultRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['面接実施予定', '書類選考通過', '面接実施済み', '採用内定', '不採用', '辞退'])
    .setAllowInvalid(false)
    .build();
  resultRange.setDataValidation(resultRule);
}

/**
 * 条件付き書式の設定
 */
function setupConditionalFormatting(sheet) {
  // 失格状況に基づく行の色分け
  const dataRange = sheet.getRange(2, 1, 1000, 27);
  
  // 適格者（緑）
  const qualifiedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$P2="適格"')
    .setBackground('#d9ead3')
    .setRanges([dataRange])
    .build();
  
  // 不適格者（赤）
  const disqualifiedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$P2<>"適格"')
    .setBackground('#f4cccc')
    .setRanges([dataRange])
    .build();
  
  sheet.setConditionalFormatRules([qualifiedRule, disqualifiedRule]);
}

/**
 * POST リクエスト受信処理（メイン関数）
 */
function doPost(e) {
  try {
    // CORS対応のヘッダー設定
    const response = {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      }
    };
    
    // OPTIONSリクエスト（プリフライト）への対応
    if (e && e.parameter && e.parameter.method === 'OPTIONS') {
      return ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // POSTデータの取得と検証
    let postData;
    try {
      const contents = e.postData ? e.postData.contents : e.parameter.data;
      postData = JSON.parse(contents);
    } catch (parseError) {
      logActivity('データ解析エラー', 'ERROR', parseError.toString());
      return createErrorResponse('データ形式が正しくありません', 400);
    }
    
    // データ検証
    const validation = validateApplicationData(postData);
    if (!validation.isValid) {
      logActivity('データ検証エラー', 'ERROR', validation.errors.join(', '));
      return createErrorResponse('データ検証エラー: ' + validation.errors.join(', '), 400);
    }
    
    // 重複チェック
    const duplicateCheck = checkForDuplicate(postData);
    if (duplicateCheck.isDuplicate) {
      logActivity('重複データ検出', 'WARNING', `電話番号: ${postData.phoneNumber}`);
      return createSuccessResponse('データは既に登録済みです', duplicateCheck.existingRow);
    }
    
    // スプレッドシートにデータ追加
    const rowNumber = addDataToSheet(postData);
    
    // 成功ログ記録
    logActivity('データ登録成功', 'INFO', `行番号: ${rowNumber}, 応募者: ${postData.applicantName}`, 
                postData.ipAddress, postData.sessionId);
    
    // 統計情報更新
    updateStatistics();
    
    return createSuccessResponse('データが正常に登録されました', rowNumber);
    
  } catch (error) {
    // エラーログ記録
    logActivity('システムエラー', 'ERROR', error.toString());
    console.error('GAS処理エラー:', error);
    return createErrorResponse('システムエラーが発生しました', 500);
  }
}

/**
 * 受信データの検証
 */
function validateApplicationData(data) {
  const errors = [];
  
  // 必須フィールドのチェック
  if (!data.applicantName || data.applicantName.trim() === '') {
    errors.push('応募者名は必須です');
  }
  
  if (!data.phoneNumber || data.phoneNumber.trim() === '') {
    errors.push('電話番号は必須です');
  } else if (!/^[\d\-\+\(\)\s]+$/.test(data.phoneNumber)) {
    errors.push('電話番号の形式が正しくありません');
  }
  
  // 11ステップの回答チェック
  for (let i = 1; i <= 11; i++) {
    const stepKey = `step${i}_answer`;
    if (!data[stepKey]) {
      errors.push(`ステップ${i}の回答が不足しています`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * 重複データチェック（電話番号ベース）
 */
function checkForDuplicate(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const phoneNumbers = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues();
  
  for (let i = 0; i < phoneNumbers.length; i++) {
    if (phoneNumbers[i][0] === data.phoneNumber) {
      return {
        isDuplicate: true,
        existingRow: i + 2
      };
    }
  }
  
  return { isDuplicate: false };
}

/**
 * スプレッドシートにデータ追加
 */
function addDataToSheet(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const now = new Date();
  
  // データ行の準備
  const rowData = [
    formatDateTime(now), // A: 応募日時
    data.applicantName || '', // B: 応募者名
    data.phoneNumber || '', // C: 電話番号
    data.applicationSource || 'モバイル応募', // D: 応募経路
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
    determineQualificationStatus(data), // P: 失格状況
    data.overallResult || '面接実施予定', // Q: 総合結果
    data.completionTime || formatDateTime(now), // R: 完了時間
    data.deviceType || getDeviceType(data.userAgent), // S: デバイス種別
    data.ipAddress || '', // T: IPアドレス
    data.userAgent || '', // U: ユーザーエージェント
    data.sessionId || '', // V: セッションID
    data.referrer || '', // W: リファラー
    data.screenResolution || '', // X: 画面解像度
    data.language || 'ja', // Y: 言語設定
    data.timezone || 'Asia/Tokyo', // Z: タイムゾーン
    data.notes || '事前確認完了' // AA: 備考
  ];
  
  // データ追加
  const newRowNumber = sheet.getLastRow() + 1;
  sheet.getRange(newRowNumber, 1, 1, rowData.length).setValues([rowData]);
  
  // 自動ソート（応募日時順）
  if (newRowNumber > 2) {
    const dataRange = sheet.getRange(2, 1, newRowNumber - 1, 27);
    dataRange.sort(1); // A列（応募日時）でソート
  }
  
  return newRowNumber;
}

/**
 * 失格状況の自動判定
 */
function determineQualificationStatus(data) {
  // 年齢確認
  if (data.step1_answer && data.step1_answer.includes('未満')) {
    return '年齢不適格';
  }
  
  // 国籍確認
  if (data.step2_answer && !data.step2_answer.includes('日本')) {
    return '国籍不適格';
  }
  
  // 前科確認
  if (data.step3_answer && data.step3_answer.includes('あり')) {
    return '前科あり';
  }
  
  // 暴力団関係
  if (data.step4_answer && data.step4_answer.includes('あり')) {
    return '暴力団関係';
  }
  
  // その他の精神的・身体的問題
  const problematicAnswers = [data.step5_answer, data.step6_answer, data.step7_answer];
  for (let answer of problematicAnswers) {
    if (answer && answer.includes('あり')) {
      return 'その他不適格';
    }
  }
  
  return '適格';
}

/**
 * デバイス種別の判定
 */
function getDeviceType(userAgent) {
  if (!userAgent) return 'Unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android')) return 'Mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
  return 'Desktop';
}

/**
 * 日時フォーマット関数
 */
function formatDateTime(date) {
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
}

/**
 * アクティビティログ記録
 */
function logActivity(action, level = 'INFO', details = '', ipAddress = '', sessionId = '') {
  try {
    const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
    const now = new Date();
    
    const logData = [
      formatDateTime(now),
      level,
      action,
      details,
      ipAddress,
      sessionId
    ];
    
    logSheet.appendRow(logData);
    
    // ログの最大行数制限（1000行）
    if (logSheet.getLastRow() > 1000) {
      logSheet.deleteRows(2, logSheet.getLastRow() - 1000);
    }
    
  } catch (error) {
    console.error('ログ記録エラー:', error);
  }
}

/**
 * 成功レスポンス作成
 */
function createSuccessResponse(message, rowNumber = null) {
  const response = {
    success: true,
    message: message,
    timestamp: formatDateTime(new Date()),
    spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
  };
  
  if (rowNumber) {
    response.rowNumber = rowNumber;
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * エラーレスポンス作成
 */
function createErrorResponse(message, statusCode = 400) {
  const response = {
    success: false,
    error: message,
    statusCode: statusCode,
    timestamp: formatDateTime(new Date())
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 統計情報更新
 */
function updateStatistics() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const dataRows = sheet.getLastRow() - 1;
    
    if (dataRows <= 0) return;
    
    // 統計情報シートを作成または取得
    let statsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('統計情報');
    if (!statsSheet) {
      statsSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('統計情報');
      setupStatisticsSheet(statsSheet);
    }
    
    // 基本統計
    const qualificationData = sheet.getRange(2, 16, dataRows, 1).getValues();
    const qualifiedCount = qualificationData.filter(row => row[0] === '適格').length;
    const disqualifiedCount = dataRows - qualifiedCount;
    const qualificationRate = dataRows > 0 ? (qualifiedCount / dataRows * 100).toFixed(1) : 0;
    
    // 統計情報更新
    const now = formatDateTime(new Date());
    statsSheet.getRange('B2').setValue(dataRows); // 総応募数
    statsSheet.getRange('B3').setValue(qualifiedCount); // 適格者数
    statsSheet.getRange('B4').setValue(disqualifiedCount); // 不適格者数
    statsSheet.getRange('B5').setValue(qualificationRate + '%'); // 適格率
    statsSheet.getRange('B6').setValue(now); // 最終更新
    
  } catch (error) {
    console.error('統計情報更新エラー:', error);
  }
}

/**
 * 統計情報シートの初期設定
 */
function setupStatisticsSheet(statsSheet) {
  const headers = [
    ['項目', '値'],
    ['総応募者数', '0'],
    ['適格者数', '0'],
    ['不適格者数', '0'],
    ['適格率', '0%'],
    ['最終更新', '']
  ];
  
  statsSheet.getRange(1, 1, headers.length, 2).setValues(headers);
  
  // フォーマット設定
  statsSheet.getRange(1, 1, 1, 2).setBackground('#0066CC').setFontColor('white').setFontWeight('bold');
  statsSheet.setColumnWidth(1, 150);
  statsSheet.setColumnWidth(2, 100);
}

/**
 * テストデータ追加（デモ用）
 */
function addTestData() {
  const testData = {
    applicantName: 'テスト太郎',
    phoneNumber: '090-0000-0001',
    applicationSource: 'デモテスト',
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
    overallResult: '面接実施予定',
    deviceType: 'Desktop',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Test Browser)',
    sessionId: 'test_session_' + Date.now(),
    language: 'ja',
    timezone: 'Asia/Tokyo',
    notes: 'テストデータ'
  };
  
  addDataToSheet(testData);
  logActivity('テストデータ追加', 'INFO', 'テスト太郎のデータを追加');
  
  SpreadsheetApp.getUi().alert('テストデータが追加されました');
}

/**
 * 全データ検証
 */
function validateAllData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const dataRows = sheet.getLastRow() - 1;
  
  if (dataRows <= 0) {
    SpreadsheetApp.getUi().alert('検証するデータがありません');
    return;
  }
  
  let errorCount = 0;
  const phoneNumbers = sheet.getRange(2, 3, dataRows, 1).getValues();
  const names = sheet.getRange(2, 2, dataRows, 1).getValues();
  
  // 重複チェック
  const phoneSet = new Set();
  for (let i = 0; i < phoneNumbers.length; i++) {
    const phone = phoneNumbers[i][0];
    if (phoneSet.has(phone)) {
      sheet.getRange(i + 2, 3).setBackground('#ffcccc');
      errorCount++;
    } else {
      phoneSet.add(phone);
      sheet.getRange(i + 2, 3).setBackground('#ffffff');
    }
  }
  
  // 空白チェック
  for (let i = 0; i < names.length; i++) {
    if (!names[i][0] || names[i][0].toString().trim() === '') {
      sheet.getRange(i + 2, 2).setBackground('#ffcccc');
      errorCount++;
    } else {
      sheet.getRange(i + 2, 2).setBackground('#ffffff');
    }
  }
  
  logActivity('データ検証実行', 'INFO', `エラー数: ${errorCount}`);
  SpreadsheetApp.getUi().alert(`データ検証完了\nエラー数: ${errorCount}`);
}