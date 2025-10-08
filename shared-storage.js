/**
 * ALSOK採用システム - 共有データストレージシステム
 * 管理者画面と応募者画面間のリアルタイム同期を実現
 */

class AlsokDemoStorage {
    constructor() {
        this.storageKey = 'alsok_demo_data';
        this.eventName = 'alsokDataUpdate';
        
        // 初期データ構造（警備会社対応版）
        this.defaultData = {
            applicants: [],
            systemLogs: [],
            stats: {
                totalApplicants: 0,
                smsSent: 0,
                interviewsStarted: 0,
                interviewsCompleted: 0,
                // 警備業特化統計
                applicationSources: {
                    phone: 0,
                    indeed: 0,
                    hellowork: 0,
                    website: 0,
                    sns: 0,
                    magazine: 0,
                    referral: 0,
                    other: 0
                },
                disqualified: 0,
                qualified: 0,
                interviewEligible: 0
            },
            lastUpdated: new Date().toISOString()
        };
        
        this.init();
    }
    
    // 初期化
    init() {
        const existing = localStorage.getItem(this.storageKey);
        if (!existing) {
            this.saveData(this.defaultData);
        }
        
        // 他のウィンドウからの変更を監視
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.notifyUpdate();
            }
        });
    }
    
    // データ取得
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.defaultData;
        } catch (error) {
            console.error('データ取得エラー:', error);
            return this.defaultData;
        }
    }
    
    // データ保存
    saveData(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            this.notifyUpdate();
        } catch (error) {
            console.error('データ保存エラー:', error);
        }
    }
    
    // 更新通知
    notifyUpdate() {
        window.dispatchEvent(new CustomEvent(this.eventName, {
            detail: this.getData()
        }));
    }
    
    // 応募者追加（警備業対応版）
    addApplicant(applicantInfo) {
        const data = this.getData();
        const applicant = {
            id: applicantInfo.id || this.generateId(),
            name: applicantInfo.name,
            phone: applicantInfo.phone,
            motivation: applicantInfo.motivation || '',
            
            // 警備業特化項目
            applicationSource: null, // 応募経路
            disqualificationReasons: [], // 欠格事由
            isQualified: null, // 採用可能性判定
            interviewEligible: null, // 面接実施可否
            recruitmentScore: 0, // 採用可能性スコア
            
            status: 'registered', // registered -> screening -> interview_started -> interview_completed
            createdAt: new Date().toISOString(),
            screeningStartedAt: null, // 事前精査開始時刻
            screeningCompletedAt: null, // 事前精査完了時刻
            interviewStartedAt: null,
            interviewCompletedAt: null,
            responses: [],
            screeningResponses: [], // 事前精査の回答
            currentQuestion: 0,
            currentScreeningStep: 0 // 現在の精査ステップ
        };
        
        data.applicants.push(applicant);
        data.stats.totalApplicants = data.applicants.length;
        
        this.addLog('新規応募者登録', `${applicant.name} (${applicant.phone}) - ID: ${applicant.id}`, 'info');
        this.saveData(data);
        
        return applicant.id;
    }
    
    // 応募者情報更新
    updateApplicant(applicantId, updates) {
        const data = this.getData();
        const applicantIndex = data.applicants.findIndex(a => a.id === applicantId);
        
        if (applicantIndex === -1) {
            console.error('応募者が見つかりません:', applicantId);
            return false;
        }
        
        const applicant = data.applicants[applicantIndex];
        
        // ステータス変更時の特別処理
        if (updates.status && updates.status !== applicant.status) {
            switch (updates.status) {
                case 'interview_started':
                    updates.interviewStartedAt = new Date().toISOString();
                    data.stats.interviewsStarted = data.applicants.filter(a => 
                        a.status === 'interview_started' || a.status === 'interview_completed'
                    ).length + 1;
                    this.addLog('面接開始', `${applicant.name} が面接を開始`, 'interview');
                    break;
                    
                case 'interview_completed':
                    updates.interviewCompletedAt = new Date().toISOString();
                    data.stats.interviewsCompleted = data.applicants.filter(a => 
                        a.status === 'interview_completed'
                    ).length + 1;
                    this.addLog('面接完了', `${applicant.name} が面接を完了`, 'success');
                    break;
            }
        }
        
        // 応募者情報を更新
        Object.assign(applicant, updates);
        this.saveData(data);
        
        return true;
    }
    
    // 応募者取得
    getApplicant(applicantId) {
        const data = this.getData();
        return data.applicants.find(a => a.id === applicantId);
    }
    
    // 全応募者取得
    getAllApplicants() {
        const data = this.getData();
        return data.applicants;
    }
    
    // 事前精査回答追加
    addScreeningResponse(applicantId, step, question, answer, answerType = 'text') {
        const data = this.getData();
        const applicant = data.applicants.find(a => a.id === applicantId);
        
        if (!applicant) {
            console.error('応募者が見つかりません:', applicantId);
            return false;
        }
        
        applicant.screeningResponses.push({
            step: step,
            question: question,
            answer: answer,
            answerType: answerType, // text, choice, boolean
            timestamp: new Date().toISOString()
        });
        
        applicant.currentScreeningStep = step;
        
        this.addLog('事前精査', `${applicant.name}: ステップ${step} 回答完了`, 'screening');
        this.saveData(data);
        
        return true;
    }
    
    // 面接回答追加
    addInterviewResponse(applicantId, question, answer) {
        const data = this.getData();
        const applicant = data.applicants.find(a => a.id === applicantId);
        
        if (!applicant) {
            console.error('応募者が見つかりません:', applicantId);
            return false;
        }
        
        applicant.responses.push({
            questionNumber: applicant.responses.length + 1,
            question: question,
            answer: answer,
            timestamp: new Date().toISOString()
        });
        
        applicant.currentQuestion = applicant.responses.length;
        
        this.addLog('面接回答', `${applicant.name}: Q${applicant.currentQuestion} 回答完了`, 'interview');
        this.saveData(data);
        
        return true;
    }
    
    // システムログ追加
    addLog(type, message, category = 'info') {
        const data = this.getData();
        const log = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            category: category // info, success, warning, error, interview
        };
        
        data.systemLogs.unshift(log); // 最新を先頭に
        
        // ログは最大100件まで保持
        if (data.systemLogs.length > 100) {
            data.systemLogs = data.systemLogs.slice(0, 100);
        }
        
        this.saveData(data);
    }
    
    // システムログ取得
    getSystemLogs(limit = 20) {
        const data = this.getData();
        return data.systemLogs.slice(0, limit);
    }
    
    // 統計情報取得
    getStats() {
        const data = this.getData();
        return data.stats;
    }
    
    // 統計情報更新
    updateStats() {
        const data = this.getData();
        
        data.stats = {
            totalApplicants: data.applicants.length,
            smsSent: data.applicants.length, // 登録 = SMS送信とみなす
            interviewsStarted: data.applicants.filter(a => 
                a.status === 'interview_started' || a.status === 'interview_completed'
            ).length,
            interviewsCompleted: data.applicants.filter(a => 
                a.status === 'interview_completed'
            ).length
        };
        
        this.saveData(data);
        return data.stats;
    }
    
    // データクリア
    clearAll() {
        this.saveData(this.defaultData);
        this.addLog('システムリセット', 'すべてのデモデータをクリアしました', 'warning');
    }
    
    // 応募経路設定
    setApplicationSource(applicantId, source) {
        const data = this.getData();
        const applicant = data.applicants.find(a => a.id === applicantId);
        
        if (!applicant) {
            return false;
        }
        
        applicant.applicationSource = source;
        
        // 応募経路統計更新
        const sourceMap = {
            1: 'phone',
            2: 'indeed', 
            3: 'hellowork',
            4: 'website',
            5: 'sns',
            6: 'magazine',
            7: 'referral',
            8: 'other'
        };
        
        const sourceKey = sourceMap[source];
        if (sourceKey && data.stats.applicationSources[sourceKey] !== undefined) {
            data.stats.applicationSources[sourceKey]++;
        }
        
        this.addLog('応募経路確認', `${applicant.name}: ${this.getSourceName(source)}から応募`, 'info');
        this.saveData(data);
        
        return true;
    }
    
    // 欠格事由チェック
    setDisqualificationCheck(applicantId, reasons = []) {
        const data = this.getData();
        const applicant = data.applicants.find(a => a.id === applicantId);
        
        if (!applicant) {
            return false;
        }
        
        applicant.disqualificationReasons = reasons;
        applicant.isQualified = reasons.length === 0;
        
        if (reasons.length > 0) {
            data.stats.disqualified++;
            this.addLog('欠格事由確認', `${applicant.name}: 欠格事由により不適格`, 'warning');
        } else {
            data.stats.qualified++;
            this.addLog('欠格事由確認', `${applicant.name}: 法的要件クリア`, 'success');
        }
        
        this.saveData(data);
        return true;
    }
    
    // 面接実施可否判定
    setInterviewEligibility(applicantId, eligible, score = 0) {
        const data = this.getData();
        const applicant = data.applicants.find(a => a.id === applicantId);
        
        if (!applicant) {
            return false;
        }
        
        applicant.interviewEligible = eligible;
        applicant.recruitmentScore = score;
        
        if (eligible) {
            data.stats.interviewEligible++;
            this.addLog('面接判定', `${applicant.name}: 面接実施決定 (スコア: ${score})`, 'success');
        } else {
            this.addLog('面接判定', `${applicant.name}: 面接見送り (スコア: ${score})`, 'warning');
        }
        
        this.saveData(data);
        return true;
    }
    
    // 応募経路名取得
    getSourceName(sourceNumber) {
        const sources = {
            1: 'お電話でのお問い合わせ',
            2: 'Indeed（インディード）',
            3: 'ハローワーク',
            4: '弊社ホームページ',
            5: 'SNS（Instagram、Twitter等）',
            6: '求人誌・フリーペーパー',
            7: '知人からの紹介',
            8: 'その他'
        };
        return sources[sourceNumber] || '不明';
    }
    
    // ID生成
    generateId() {
        return 'APP' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    // 更新イベントリスナー登録
    onUpdate(callback) {
        window.addEventListener(this.eventName, callback);
    }
    
    // 更新イベントリスナー削除
    offUpdate(callback) {
        window.removeEventListener(this.eventName, callback);
    }
}

// グローバルインスタンス
window.alsokStorage = new AlsokDemoStorage();

// エクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlsokDemoStorage;
}