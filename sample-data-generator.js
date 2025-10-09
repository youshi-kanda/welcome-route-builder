/**
 * ALSOK採用システム - サンプルデータ生成器
 * スプレッドシートのテスト用にリアルなサンプルデータを生成
 */

class AlsokSampleDataGenerator {
    constructor() {
        // サンプル名前リスト
        this.sampleNames = [
            '田中 太郎', '鈴木 花子', '佐藤 健', '高橋 美咲', '伊藤 大輔',
            '渡辺 優子', '山本 翔', '中村 恵', '小林 誠', '加藤 莉奈',
            '吉田 陽介', '山田 由香', '松本 拓也', '井上 真理', '木村 光一'
        ];

        // サンプル電話番号（架空）
        this.samplePhones = [
            '090-1234-5678', '080-9876-5432', '070-5555-1111', '090-8888-2222',
            '080-3333-7777', '070-9999-4444', '090-1111-8888', '080-7777-3333',
            '070-2222-9999', '090-4444-6666', '080-6666-5555', '070-1357-2468',
            '090-8642-9753', '080-1122-3344', '070-5566-7788'
        ];

        // サンプル回答パターン
        this.sampleMotivations = [
            '責任感を持って地域の安全に貢献したい',
            '人や財産を守る仕事にやりがいを感じる',
            '長期的に安定した仕事に就きたい',
            '警備業界での経験を積みたい',
            '社会貢献できる仕事を探している'
        ];

        this.sampleResponsibilities = [
            '重大な責任だと理解しており、真剣に取り組みたいと思います',
            '人命や財産を預かる重要な仕事だと認識しています',
            '責任の重さを十分理解し、プロ意識を持って務めます',
            'しっかりとした研修を受けて、責任を果たしたいです',
            '地域の安全を守る使命感を持って働きたいです'
        ];

        this.samplePreparations = [
            '警備業法について勉強したい',
            '勤務地や具体的なシフトについて教えてください',
            '必要な資格があれば取得したいです',
            '研修内容について詳しく知りたいです',
            '職場の雰囲気や先輩方の話を聞きたいです'
        ];
    }

    /**
     * ランダムな要素を配列から選択
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * ランダムな日時を生成（過去1週間以内）
     */
    generateRandomDate(hoursAgo = 168) { // デフォルト1週間
        const now = new Date();
        const randomHours = Math.floor(Math.random() * hoursAgo);
        return new Date(now.getTime() - randomHours * 60 * 60 * 1000);
    }

    /**
     * 11段階の事前確認回答を生成
     */
    generateScreeningResponses() {
        const responses = [];

        // Step 1: 応募経路
        responses.push({
            step: 1,
            question: 'まず、どちらから弊社の求人をお知りになりましたか？',
            answer: Math.floor(Math.random() * 8) + 1,
            answerType: 'choice',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        // Step 2: 欠格事由チェック
        const disqualificationAnswer = Math.random() > 0.8 ? 
            [Math.floor(Math.random() * 5) + 1] : [6]; // 80%の確率で「該当なし」
        responses.push({
            step: 2,
            question: '警備業法に基づき、以下の事項について確認させていただきます。',
            answer: disqualificationAnswer,
            answerType: 'choice',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        // Step 3: 勤務期間
        responses.push({
            step: 3,
            question: '継続的に勤務していただくことが重要ですが、どのくらいの期間お勤めいただけますか？',
            answer: Math.floor(Math.random() * 5) + 1,
            answerType: 'choice',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        // Step 4: 体力業務
        const physicalCapabilities = Math.random() > 0.7 ? 
            [5] : [1, 2, 3].slice(0, Math.floor(Math.random() * 3) + 1);
        responses.push({
            step: 4,
            question: '警備業務の特性上、体力面での確認をさせていただきます。',
            answer: physicalCapabilities,
            answerType: 'choice',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        // Step 5: 意気込み（テキスト）
        responses.push({
            step: 5,
            question: '警備員として働く上での意気込みや、特にアピールしたいことがあれば教えてください。',
            answer: this.randomChoice(this.sampleMotivations),
            answerType: 'text',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        // Step 6: 業務知識
        responses.push({
            step: 6,
            question: '警備員の仕事内容をご存知ですか？',
            answer: Math.floor(Math.random() * 3) + 1,
            answerType: 'choice',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        // Step 7: 責任について（テキスト）
        responses.push({
            step: 7,
            question: '人や財産を守る責任の重さについてどう思いますか？',
            answer: this.randomChoice(this.sampleResponsibilities),
            answerType: 'text',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        // Step 8: 研修意欲
        responses.push({
            step: 8,
            question: '研修や資格取得に意欲はありますか？',
            answer: Math.floor(Math.random() * 3) + 1,
            answerType: 'choice',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        // Step 9: 重視する点
        const priorityAnswer = Math.floor(Math.random() * 4) + 1;
        const step9Response = {
            step: 9,
            question: '今回の応募で最も重視することは？',
            answer: priorityAnswer,
            answerType: 'choice',
            timestamp: this.generateRandomDate(2).toISOString()
        };
        
        // 「その他」選択時のフォローアップ
        if (priorityAnswer === 4) {
            step9Response.followUp = 'スキルアップの機会や職場環境を重視しています';
        }
        responses.push(step9Response);

        // Step 10: 他社状況
        responses.push({
            step: 10,
            question: '他社も検討中ですか？',
            answer: Math.floor(Math.random() * 3) + 1,
            answerType: 'choice',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        // Step 11: 面接準備（テキスト）
        responses.push({
            step: 11,
            question: '面接までに準備したいことや、弊社について知りたいことはありますか？',
            answer: this.randomChoice(this.samplePreparations),
            answerType: 'text',
            timestamp: this.generateRandomDate(2).toISOString()
        });

        return responses;
    }

    /**
     * 単一のサンプル応募者データを生成
     */
    generateSampleApplicant(index = 0) {
        const createdAt = this.generateRandomDate(48); // 2日以内
        const screeningStartedAt = new Date(createdAt.getTime() + Math.random() * 3600000); // 1時間以内に開始
        const screeningCompletedAt = new Date(screeningStartedAt.getTime() + Math.random() * 1800000 + 600000); // 10-40分で完了
        
        const responses = this.generateScreeningResponses();
        const applicationSource = responses[0].answer; // Step 1の回答
        const disqualificationReasons = responses[1].answer; // Step 2の回答

        return {
            id: `APP${Date.now().toString(36)}${Math.random().toString(36).substr(2, 3)}`,
            name: this.sampleNames[index % this.sampleNames.length],
            phone: this.samplePhones[index % this.samplePhones.length],
            motivation: this.randomChoice(this.sampleMotivations),
            
            applicationSource: applicationSource,
            disqualificationReasons: disqualificationReasons,
            isQualified: disqualificationReasons.includes(6) && disqualificationReasons.length === 1,
            interviewEligible: null,
            recruitmentScore: 0,
            
            status: 'interview_completed',
            createdAt: createdAt.toISOString(),
            screeningStartedAt: screeningStartedAt.toISOString(),
            screeningCompletedAt: screeningCompletedAt.toISOString(),
            interviewStartedAt: null,
            interviewCompletedAt: null,
            
            responses: [],
            screeningResponses: responses,
            currentQuestion: 0,
            currentScreeningStep: 11
        };
    }

    /**
     * 複数のサンプル応募者データを生成
     */
    generateMultipleSampleApplicants(count = 10) {
        const applicants = [];
        for (let i = 0; i < count; i++) {
            applicants.push(this.generateSampleApplicant(i));
        }
        return applicants;
    }

    /**
     * サンプルデータをストレージに追加
     */
    addSampleDataToStorage(count = 5) {
        const sampleApplicants = this.generateMultipleSampleApplicants(count);
        const storage = window.alsokStorage;
        
        sampleApplicants.forEach(applicant => {
            // 直接applicants配列に追加（addApplicantメソッドをバイパス）
            const data = storage.getData();
            data.applicants.push(applicant);
            
            // 統計更新
            data.stats.totalApplicants = data.applicants.length;
            data.stats.interviewsCompleted = data.applicants.filter(a => 
                a.status === 'interview_completed'
            ).length;
            
            // 応募経路統計更新
            const sourceMap = {1: 'phone', 2: 'indeed', 3: 'hellowork', 4: 'website', 
                            5: 'sns', 6: 'magazine', 7: 'referral', 8: 'other'};
            const sourceKey = sourceMap[applicant.applicationSource];
            if (sourceKey && data.stats.applicationSources[sourceKey] !== undefined) {
                data.stats.applicationSources[sourceKey]++;
            }
            
            storage.saveData(data);
        });
        
        console.log(`${count}件のサンプルデータを追加しました`);
        return sampleApplicants;
    }

    /**
     * 全データクリア後にサンプルデータを設定
     */
    resetWithSampleData(count = 10) {
        if (window.alsokStorage) {
            window.alsokStorage.clearAll();
            return this.addSampleDataToStorage(count);
        }
        return [];
    }
}

// グローバルインスタンス
window.alsokSampleGenerator = new AlsokSampleDataGenerator();

// エクスポート（ES6モジュール対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlsokSampleDataGenerator;
}