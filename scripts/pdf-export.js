/**
 * ALSOK採用システム - PDF出力機能
 * 事前確認データをPDF形式でエクスポート
 */

class AlsokPDFExporter {
    constructor() {
        // jsPDFライブラリの読み込み確認
        this.jsPDFLoaded = false;
        this.loadJsPDF();

        // データマッピング定義（CSV出力と同じ）
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
    }

    /**
     * jsPDFライブラリの動的読み込み
     */
    async loadJsPDF() {
        if (typeof window.jspdf !== 'undefined') {
            this.jsPDFLoaded = true;
            return;
        }

        try {
            // jsPDFとフォントライブラリを読み込み
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            this.jsPDFLoaded = true;
            console.log('jsPDF loaded successfully');
        } catch (error) {
            console.error('Failed to load jsPDF:', error);
            this.jsPDFLoaded = false;
        }
    }

    /**
     * スクリプトの動的読み込み
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
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
     * 所要時間計算（分単位）
     */
    calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return '';
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end - start;
        const durationMinutes = Math.ceil(durationMs / (1000 * 60));
        
        return durationMinutes > 0 ? `${durationMinutes}分` : '';
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
     * 事前確認回答の処理
     */
    processScreeningResponses(responses) {
        const processedResponses = [];
        
        responses.forEach(response => {
            let answer = '';
            
            switch (response.step) {
                case 1: // 応募経路
                    answer = this.sourceMapping[response.answer] || response.answer;
                    break;
                    
                case 2: // 欠格事由チェック
                    if (Array.isArray(response.answer)) {
                        answer = response.answer
                            .map(id => this.disqualificationMapping[id] || id)
                            .join('、');
                    } else {
                        answer = this.disqualificationMapping[response.answer] || response.answer;
                    }
                    break;
                    
                case 3: // 勤務期間
                    answer = this.durationMapping[response.answer] || response.answer;
                    break;
                    
                case 4: // 体力業務
                    if (Array.isArray(response.answer)) {
                        answer = response.answer
                            .map(id => this.physicalCapabilityMapping[id] || id)
                            .join('、');
                    } else {
                        answer = this.physicalCapabilityMapping[response.answer] || response.answer;
                    }
                    break;
                    
                case 5: // 意気込み（テキスト）
                    answer = response.answer || '';
                    break;
                    
                case 6: // 業務知識
                    answer = this.knowledgeMapping[response.answer] || response.answer;
                    break;
                    
                case 7: // 責任について（テキスト）
                    answer = response.answer || '';
                    break;
                    
                case 8: // 研修意欲
                    answer = this.trainingMapping[response.answer] || response.answer;
                    break;
                    
                case 9: // 重視する点
                    answer = this.priorityMapping[response.answer] || response.answer;
                    if (response.answer === 4 && response.followUp) {
                        answer += `: ${response.followUp}`;
                    }
                    break;
                    
                case 10: // 他社状況
                    answer = this.competitorMapping[response.answer] || response.answer;
                    break;
                    
                case 11: // 面接準備（テキスト）
                    answer = response.answer || '';
                    break;
            }
            
            processedResponses.push({
                step: response.step,
                question: response.question,
                answer: answer
            });
        });
        
        return processedResponses;
    }

    /**
     * PDFテキストの自動折り返し
     */
    splitTextToLines(doc, text, maxWidth) {
        if (!text) return [''];
        const lines = doc.splitTextToSize(text, maxWidth);
        return Array.isArray(lines) ? lines : [lines];
    }

    /**
     * PDF生成
     */
    async generatePDF(applicant) {
        if (!this.jsPDFLoaded) {
            await this.loadJsPDF();
        }

        if (!this.jsPDFLoaded || typeof window.jspdf === 'undefined') {
            throw new Error('jsPDFライブラリの読み込みに失敗しました');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        let yPosition = 20;
        const leftMargin = 20;
        const rightMargin = 190;
        const lineHeight = 7;
        const sectionSpacing = 10;

        // タイトル
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('ALSOK 事前確認データ', leftMargin, yPosition);
        yPosition += sectionSpacing + 5;

        // 生成日時
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`出力日時: ${this.formatDateTime(new Date())}`, leftMargin, yPosition);
        yPosition += sectionSpacing;

        // 基本情報セクション
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('基本情報', leftMargin, yPosition);
        yPosition += lineHeight;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const basicInfo = [
            { label: '応募者名', value: applicant.name || '' },
            { label: '電話番号', value: applicant.phone || '' },
            { label: '応募経路', value: this.sourceMapping[applicant.applicationSource] || '' },
            { label: '登録日時', value: this.formatDateTime(applicant.createdAt) },
            { label: '事前確認完了', value: this.formatDateTime(applicant.screeningCompletedAt) },
            { label: '所要時間', value: this.calculateDuration(applicant.screeningStartedAt, applicant.screeningCompletedAt) },
            { label: '法的適格性', value: this.determineLegalStatus(applicant.disqualificationReasons || []) }
        ];

        basicInfo.forEach(item => {
            doc.setFont(undefined, 'bold');
            doc.text(`${item.label}:`, leftMargin, yPosition);
            doc.setFont(undefined, 'normal');
            doc.text(item.value, leftMargin + 40, yPosition);
            yPosition += lineHeight;
        });

        yPosition += sectionSpacing;

        // 事前確認回答セクション
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('事前確認回答', leftMargin, yPosition);
        yPosition += lineHeight + 2;

        const responses = this.processScreeningResponses(applicant.screeningResponses || []);
        
        doc.setFontSize(10);
        responses.forEach((response, index) => {
            // ページ終端チェック
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }

            // 質問
            doc.setFont(undefined, 'bold');
            const questionLines = this.splitTextToLines(doc, `Q${response.step}. ${response.question}`, rightMargin - leftMargin);
            questionLines.forEach(line => {
                doc.text(line, leftMargin, yPosition);
                yPosition += lineHeight;
            });

            // 回答
            doc.setFont(undefined, 'normal');
            const answerLines = this.splitTextToLines(doc, response.answer, rightMargin - leftMargin - 5);
            answerLines.forEach(line => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, leftMargin + 5, yPosition);
                yPosition += lineHeight;
            });

            yPosition += 3; // 質問間のスペース
        });

        // フッター
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(
                `ALSOK採用システム - Page ${i} of ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        return doc;
    }

    /**
     * ファイル名用日付フォーマット
     */
    formatFileDate() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    }

    /**
     * 単一応募者のPDFエクスポート
     */
    async exportSingleApplicant(applicantId) {
        try {
            const applicant = window.alsokStorage.getApplicant(applicantId);
            if (!applicant) {
                alert('応募者データが見つかりません');
                return false;
            }

            // PDF生成
            const doc = await this.generatePDF(applicant);
            
            // ダウンロード
            const filename = `${applicant.name}_事前確認データ_${this.formatFileDate()}.pdf`;
            doc.save(filename);
            
            return true;
        } catch (error) {
            console.error('PDF出力エラー:', error);
            alert('PDFの生成中にエラーが発生しました。\n' + error.message);
            return false;
        }
    }

    /**
     * 全応募者のPDFエクスポート（複数ページ）
     */
    async exportAllApplicants() {
        try {
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

            if (!this.jsPDFLoaded) {
                await this.loadJsPDF();
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // 各応募者のデータを順番に追加
            for (let i = 0; i < completedApplicants.length; i++) {
                if (i > 0) {
                    doc.addPage();
                }
                
                const tempDoc = await this.generatePDF(completedApplicants[i]);
                // ページをマージ（簡易版：最初のページのみ）
                // 実際には各応募者を別ページに配置する実装が必要
            }

            const filename = `ALSOK採用データ_全${completedApplicants.length}名_${this.formatFileDate()}.pdf`;
            doc.save(filename);
            
            return true;
        } catch (error) {
            console.error('PDF一括出力エラー:', error);
            alert('PDFの生成中にエラーが発生しました。\n' + error.message);
            return false;
        }
    }
}

// グローバルインスタンス
window.alsokPDFExporter = new AlsokPDFExporter();

// エクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlsokPDFExporter;
}
