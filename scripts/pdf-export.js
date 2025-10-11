/**
 * ALSOK採用システム - PDF出力機能
 * 事前確認データをPDF形式でエクスポート（日本語対応版）
 */

class AlsokPDFExporter {
    constructor() {
        // html2canvasとjsPDFライブラリの読み込み確認
        this.librariesLoaded = false;
        this.loadLibraries();

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
     * html2canvasとjsPDFライブラリの動的読み込み
     */
    async loadLibraries() {
        if (typeof window.jspdf !== 'undefined' && typeof window.html2canvas !== 'undefined' && this.librariesLoaded) {
            return;
        }

        try {
            // html2canvasを読み込み（HTMLをCanvasに変換するため）
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            
            // jsPDF本体を読み込み
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            
            this.librariesLoaded = true;
            console.log('html2canvas and jsPDF loaded successfully');
        } catch (error) {
            console.error('Failed to load PDF libraries:', error);
            this.librariesLoaded = false;
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
     * 事前確認回答の処理（新11ステップ対応版）
     */
    processScreeningResponses(responses) {
        const processedResponses = [];
        
        responses.forEach(response => {
            let answer = '';
            
            switch (response.step) {
                case 1: // Q1: 応募経路詳細
                    answer = this.sourceMapping[response.answer] || response.answer;
                    break;
                    
                case 2: // Q2: 欠格事由確認
                    if (Array.isArray(response.answer)) {
                        answer = response.answer
                            .map(id => this.disqualificationMapping[id] || id)
                            .join('、');
                    } else {
                        answer = this.disqualificationMapping[response.answer] || response.answer;
                    }
                    break;
                    
                case 3: // Q3: 勤務期間希望
                    answer = this.durationMapping[response.answer] || response.answer;
                    break;
                    
                case 4: // Q4: 体力面・業務対応
                    if (Array.isArray(response.answer)) {
                        answer = response.answer
                            .map(id => this.physicalCapabilityMapping[id] || id)
                            .join('、');
                    } else {
                        answer = this.physicalCapabilityMapping[response.answer] || response.answer;
                    }
                    break;
                    
                case 5: // Q5: 意気込み・アピール（テキスト）
                    answer = response.answer || '';
                    break;
                    
                case 6: // Q6: 仕事内容理解度
                    answer = this.knowledgeMapping[response.answer] || response.answer;
                    break;
                    
                case 7: // Q7: 責任の重さ認識（テキスト）
                    answer = response.answer || '';
                    break;
                    
                case 8: // Q8: 研修・資格意欲
                    answer = this.trainingMapping[response.answer] || response.answer;
                    break;
                    
                case 9: // Q9: 重視する点
                    answer = this.priorityMapping[response.answer] || response.answer;
                    break;
                    
                case 10: // Q10: 他社検討状況
                    answer = this.competitorMapping[response.answer] || response.answer;
                    break;
                    
                case 11: // Q11: 面接準備・質問（テキスト）
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
     * HTML要素を作成してPDF生成
     */
    async generatePDF(applicant) {
        if (!this.librariesLoaded) {
            await this.loadLibraries();
        }

        if (!this.librariesLoaded || typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
            throw new Error('PDFライブラリの読み込みに失敗しました');
        }

        // HTML要素を作成
        const htmlContent = this.generateHTMLContent(applicant);
        
        // 一時的なコンテナを作成
        const container = document.createElement('div');
        container.innerHTML = htmlContent;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '794px'; // A4幅（72dpi基準）
        container.style.padding = '40px';
        container.style.fontFamily = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif';
        container.style.fontSize = '14px';
        container.style.lineHeight = '1.6';
        container.style.color = '#333';
        container.style.backgroundColor = '#fff';
        
        document.body.appendChild(container);

        try {
            // HTML要素をCanvasに変換
            const canvas = await window.html2canvas(container, {
                scale: 2, // 高解像度
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true
            });

            // PDFを作成
            const { jsPDF } = window.jspdf;
            const imgWidth = 210; // A4幅（mm）
            const pageHeight = 295; // A4高さ（mm）
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            const doc = new jsPDF('p', 'mm', 'a4');
            let position = 0;

            // 画像をPDFに追加
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 複数ページに分割
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            return doc;
        } finally {
            // 一時的なコンテナを削除
            document.body.removeChild(container);
        }
    }

    /**
     * HTML形式のコンテンツを生成
     */
    generateHTMLContent(applicant) {
        const responses = this.processScreeningResponses(applicant.screeningResponses || []);
        const duration = this.calculateDuration(applicant.screeningStartedAt, applicant.screeningCompletedAt);
        const legalStatus = this.determineLegalStatus(applicant.disqualificationReasons || []);
        
        return `
            <div style="max-width: 700px; margin: 0 auto;">
                <h1 style="text-align: center; color: #003DA5; border-bottom: 3px solid #003DA5; padding-bottom: 10px; margin-bottom: 30px;">
                    ALSOK 事前確認データ
                </h1>
                
                <div style="text-align: right; font-size: 12px; color: #666; margin-bottom: 30px;">
                    出力日時: ${this.formatDateTime(new Date())}
                </div>

                <h2 style="background: #f8f9fa; padding: 12px; margin: 20px 0 15px 0; border-left: 4px solid #003DA5; font-size: 16px;">
                    基本情報
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold; width: 30%;">応募者名</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${applicant.name || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">電話番号</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${applicant.phone || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">応募経路</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${this.sourceMapping[applicant.applicationSource] || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">登録日時</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${this.formatDateTime(applicant.createdAt)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">事前確認完了</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${this.formatDateTime(applicant.screeningCompletedAt)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">所要時間</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${duration}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">法的適格性</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${legalStatus}</td>
                    </tr>
                </table>

                <h2 style="background: #f8f9fa; padding: 12px; margin: 20px 0 15px 0; border-left: 4px solid #003DA5; font-size: 16px;">
                    事前確認回答
                </h2>
                
                ${responses.map(response => `
                    <div style="margin-bottom: 25px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
                        <div style="background: #003DA5; color: white; padding: 12px; font-weight: bold;">
                            Q${response.step}. ${response.question}
                        </div>
                        <div style="padding: 15px; background: white;">
                            ${response.answer.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                `).join('')}
                
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                    ALSOK採用システム - 事前確認データ
                </div>
            </div>
        `;
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
