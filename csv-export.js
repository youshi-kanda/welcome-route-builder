/**
 * ALSOK採用システム - CSV出力機能
 * 事前確認データをスプレッドシート形式でエクスポート
 */

class AlsokCSVExporter {
    constructor() {
        // データマッピング定義
        this.sourceMapping = {
            1: 'お電話でのお問い合わせ',
            2: 'Indeed（インディード）',
            3: 'ハローワーク',
            4: '弊社ホームページ',
            5: 'SNS（Instagram、Twitter等）',
            6: '求人誌・フリーペーパー',
            7: '知人からの紹介',
            8: 'その他'
        };

        this.disqualificationMapping = {
            1: '禁錮以上の刑',
            2: '警備業法違反罰金刑',
            3: '精神機能障害',
            4: '薬物中毒',
            5: '暴力団関係',
            6: '該当なし'
        };

        this.statusMapping = {
            'registered': '登録済み',
            'screening': '事前確認中',
            'interview_started': '面接開始',
            'interview_completed': '面接完了'
        };

        this.durationMapping = {
            1: '1年以上の長期勤務を希望',
            2: '半年〜1年程度',
            3: '3ヶ月〜半年程度',
            4: '短期間（数ヶ月以内）',
            5: '未定・状況による'
        };

        this.physicalCapabilityMapping = {
            1: '立位業務（長時間の立ち仕事）',
            2: '巡回業務（歩行・階段昇降）',
            3: '夜勤業務（深夜勤務）',
            4: '交通誘導（屋外作業）',
            5: '上記すべて対応可能',
            6: '一部対応困難'
        };

        this.knowledgeMapping = {
            1: 'よく知っている',
            2: '少し知っている',
            3: '全く知らない'
        };

        this.trainingMapping = {
            1: '積極的に取り組みたい',
            2: '必要に応じて取り組む',
            3: 'あまり興味がない'
        };

        this.priorityMapping = {
            1: '給与・待遇',
            2: '雇用の安定性',
            3: '仕事のやりがい',
            4: 'その他'
        };

        this.competitorMapping = {
            1: '弊社のみに応募',
            2: '数社検討中',
            3: '多数応募中'
        };

        // CSVヘッダー定義
        this.csvHeaders = [
            // 基本情報セクション
            '応募者ID',
            '氏名',
            '電話番号',
            '応募経路',
            '登録日時',
            '事前確認開始',
            '事前確認完了',
            '所要時間（分）',
            'ステータス',
            '法的適格性',
            
            // 事前確認回答セクション
            'Q1_応募経路詳細',
            'Q2_欠格事由チェック',
            'Q3_勤務期間希望',
            'Q4_体力業務対応',
            'Q5_意気込み・アピール',
            'Q6_警備業務知識',
            'Q7_責任についての考え',
            'Q8_研修・資格意欲',
            'Q9_重視する点',
            'Q9_その他詳細',
            'Q10_他社検討状況',
            'Q11_面接準備・質問',
            
            // 管理用セクション
            '採用担当者メモ',
            '面接実施判定',
            '判定理由',
            '次回アクション',
            '更新日時'
        ];
    }

    /**
     * 単一応募者データをCSV行に変換
     */
    convertApplicantToCSVRow(applicant) {
        // 基本情報の処理
        const basicInfo = this.processBasicInfo(applicant);
        
        // 事前確認回答の処理
        const screeningResponses = this.processScreeningResponses(applicant.screeningResponses || []);
        
        // 管理用情報（空欄で初期化）
        const managementInfo = ['', '', '', '', new Date().toISOString()];
        
        return [...basicInfo, ...screeningResponses, ...managementInfo];
    }

    /**
     * 基本情報の処理
     */
    processBasicInfo(applicant) {
        const duration = this.calculateDuration(applicant.screeningStartedAt, applicant.screeningCompletedAt);
        const legalStatus = this.determineLegalStatus(applicant.disqualificationReasons || []);
        
        return [
            applicant.id || '',
            applicant.name || '',
            applicant.phone || '',
            this.sourceMapping[applicant.applicationSource] || '',
            this.formatDateTime(applicant.createdAt),
            this.formatDateTime(applicant.screeningStartedAt),
            this.formatDateTime(applicant.screeningCompletedAt),
            duration,
            this.statusMapping[applicant.status] || applicant.status || '',
            legalStatus
        ];
    }

    /**
     * 事前確認回答の処理
     */
    processScreeningResponses(responses) {
        // 11段階の回答を初期化
        const processedResponses = new Array(12).fill(''); // Q1-Q11 + Q9その他詳細
        
        responses.forEach(response => {
            const stepIndex = response.step - 1;
            
            switch (response.step) {
                case 1: // 応募経路
                    processedResponses[0] = this.sourceMapping[response.answer] || response.answer;
                    break;
                    
                case 2: // 欠格事由チェック
                    if (Array.isArray(response.answer)) {
                        processedResponses[1] = response.answer
                            .map(id => this.disqualificationMapping[id] || id)
                            .join('、');
                    } else {
                        processedResponses[1] = this.disqualificationMapping[response.answer] || response.answer;
                    }
                    break;
                    
                case 3: // 勤務期間
                    processedResponses[2] = this.durationMapping[response.answer] || response.answer;
                    break;
                    
                case 4: // 体力業務
                    if (Array.isArray(response.answer)) {
                        processedResponses[3] = response.answer
                            .map(id => this.physicalCapabilityMapping[id] || id)
                            .join('、');
                    } else {
                        processedResponses[3] = this.physicalCapabilityMapping[response.answer] || response.answer;
                    }
                    break;
                    
                case 5: // 意気込み（テキスト）
                    processedResponses[4] = this.sanitizeText(response.answer);
                    break;
                    
                case 6: // 業務知識
                    processedResponses[5] = this.knowledgeMapping[response.answer] || response.answer;
                    break;
                    
                case 7: // 責任について（テキスト）
                    processedResponses[6] = this.sanitizeText(response.answer);
                    break;
                    
                case 8: // 研修意欲
                    processedResponses[7] = this.trainingMapping[response.answer] || response.answer;
                    break;
                    
                case 9: // 重視する点
                    processedResponses[8] = this.priorityMapping[response.answer] || response.answer;
                    // フォローアップ回答をチェック
                    if (response.answer === 4 && response.followUp) {
                        processedResponses[9] = this.sanitizeText(response.followUp);
                    }
                    break;
                    
                case 10: // 他社状況
                    processedResponses[10] = this.competitorMapping[response.answer] || response.answer;
                    break;
                    
                case 11: // 面接準備（テキスト）
                    processedResponses[11] = this.sanitizeText(response.answer);
                    break;
            }
        });
        
        return processedResponses;
    }

    /**
     * 所要時間計算（分単位）
     */
    calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return '';
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end - start;
        const durationMinutes = Math.ceil(durationMs / (1000 * 60));
        
        return durationMinutes > 0 ? durationMinutes : '';
    }

    /**
     * 法的適格性判定
     */
    determineLegalStatus(disqualificationReasons) {
        if (!disqualificationReasons || disqualificationReasons.length === 0) {
            return '未確認';
        }
        
        if (disqualificationReasons.includes(6) && disqualificationReasons.length === 1) {
            return '適格';
        }
        
        const issues = disqualificationReasons
            .filter(reason => reason !== 6)
            .map(reason => this.disqualificationMapping[reason] || reason);
            
        return issues.length > 0 ? `要注意: ${issues.join('、')}` : '適格';
    }

    /**
     * 日時フォーマット
     */
    formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        
        const date = new Date(dateTimeString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * テキストサニタイズ（CSV用）
     */
    sanitizeText(text) {
        if (!text) return '';
        
        // 改行を空白に置換、カンマやダブルクォートをエスケープ
        return text
            .replace(/[\r\n]+/g, ' ')
            .replace(/"/g, '""')
            .trim();
    }

    /**
     * CSVデータ生成
     */
    generateCSV(applicants) {
        if (!Array.isArray(applicants)) {
            applicants = [applicants];
        }

        // ヘッダー行
        const csvRows = [this.csvHeaders];

        // データ行
        applicants.forEach(applicant => {
            if (applicant && applicant.screeningResponses) {
                csvRows.push(this.convertApplicantToCSVRow(applicant));
            }
        });

        // CSV文字列生成
        return csvRows.map(row => {
            return row.map(field => {
                // フィールドにカンマや改行、ダブルクォートが含まれる場合はダブルクォートで囲む
                const fieldStr = String(field);
                if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
                    return `"${fieldStr}"`;
                }
                return fieldStr;
            }).join(',');
        }).join('\r\n');
    }

    /**
     * CSVファイルダウンロード
     */
    downloadCSV(applicants, filename = null) {
        const csvContent = this.generateCSV(applicants);
        
        // UTF-8 BOM付きでエンコード
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        // ダウンロード処理
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const defaultFilename = `ALSOK採用データ_${this.formatFileDate()}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename || defaultFilename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // メモリクリーンアップ
        URL.revokeObjectURL(url);
    }

    /**
     * ファイル名用日付フォーマット
     */
    formatFileDate() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    }

    /**
     * 単一応募者のCSVエクスポート
     */
    exportSingleApplicant(applicantId) {
        const applicant = window.alsokStorage.getApplicant(applicantId);
        if (!applicant) {
            alert('応募者データが見つかりません');
            return false;
        }

        this.downloadCSV([applicant], `${applicant.name}_事前確認データ_${this.formatFileDate()}.csv`);
        return true;
    }

    /**
     * 全応募者のCSVエクスポート
     */
    exportAllApplicants() {
        const applicants = window.alsokStorage.getAllApplicants();
        if (!applicants || applicants.length === 0) {
            alert('エクスポートできるデータがありません');
            return false;
        }

        // 事前確認完了者のみをフィルタ
        const completedApplicants = applicants.filter(a => 
            a.screeningResponses && a.screeningResponses.length > 0
        );

        if (completedApplicants.length === 0) {
            alert('事前確認を完了した応募者がいません');
            return false;
        }

        this.downloadCSV(completedApplicants);
        return true;
    }
}

// グローバルインスタンス
window.alsokCSVExporter = new AlsokCSVExporter();

// エクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlsokCSVExporter;
}