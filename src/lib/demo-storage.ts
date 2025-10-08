// デモ専用データストレージ
// localStorage + IndexedDB でリアルなデータ体験

export interface DemoApplicant {
  applicant_id: string;
  name: string;
  phone: string;
  created_at: string;
  status: 'pending' | 'interviewed' | 'pass' | 'fail';
  chat_responses?: Array<{
    question: string;
    answer: string;
    timestamp: string;
  }>;
  interview_slot?: string;
  decision_memo?: string;
}

interface DemoMessage {
  id: string;
  applicant_id: string;
  at: string;
  direction: 'in' | 'out' | 'sys';
  content: string;
  channel: 'sms' | 'email' | 'note';
  status?: 'sent' | 'delivered' | 'failed';
}

class DemoStorage {
  private static STORAGE_KEYS = {
    applicants: 'demo_applicants',
    messages: 'demo_messages',
    interviews: 'demo_interviews',
    session: 'demo_session'
  };

  // 応募者データ管理
  static saveApplicant(applicant: DemoApplicant): void {
    const applicants = this.getApplicants();
    const existingIndex = applicants.findIndex(a => a.applicant_id === applicant.applicant_id);
    
    if (existingIndex >= 0) {
      applicants[existingIndex] = { ...applicants[existingIndex], ...applicant };
    } else {
      applicants.push(applicant);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.applicants, JSON.stringify(applicants));
    
    // リアルタイム更新イベント発火
    window.dispatchEvent(new CustomEvent('demo-data-updated', { 
      detail: { type: 'applicant', data: applicant }
    }));
  }

  static getApplicants(): DemoApplicant[] {
    const stored = localStorage.getItem(this.STORAGE_KEYS.applicants);
    return stored ? JSON.parse(stored) : [];
  }

  static getApplicant(id: string): DemoApplicant | null {
    const applicants = this.getApplicants();
    return applicants.find(a => a.applicant_id === id) || null;
  }

  // メッセージ履歴管理
  static saveMessage(message: DemoMessage): void {
    const messages = this.getMessages();
    messages.unshift(message); // 最新を先頭に
    
    // 最新100件まで保持
    const trimmed = messages.slice(0, 100);
    localStorage.setItem(this.STORAGE_KEYS.messages, JSON.stringify(trimmed));
    
    // リアルタイム更新
    window.dispatchEvent(new CustomEvent('demo-message-added', { 
      detail: message 
    }));
  }

  static getMessages(): DemoMessage[] {
    const stored = localStorage.getItem(this.STORAGE_KEYS.messages);
    return stored ? JSON.parse(stored) : [];
  }

  // セッション管理
  static setSessionData(key: string, value: any): void {
    const session = this.getSessionData();
    session[key] = value;
    localStorage.setItem(this.STORAGE_KEYS.session, JSON.stringify(session));
  }

  static getSessionData(): Record<string, any> {
    const stored = localStorage.getItem(this.STORAGE_KEYS.session);
    return stored ? JSON.parse(stored) : {};
  }

  // デモデータ初期化
  static initializeDemoData(): void {
    // サンプル応募者データ
    const sampleApplicants: DemoApplicant[] = [
      {
        applicant_id: 'demo_001',
        name: '山田太郎',
        phone: '+819012345678',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'interviewed'
      },
      {
        applicant_id: 'demo_002', 
        name: '佐藤花子',
        phone: '+819087654321',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        status: 'pass'
      }
    ];

    // サンプルメッセージ
    const sampleMessages: DemoMessage[] = [
      {
        id: 'msg_demo_001',
        applicant_id: 'demo_001',
        at: new Date(Date.now() - 3600000).toISOString(),
        direction: 'out',
        content: '山田様、ALSOK採用チームです。応募を受け付けました。',
        channel: 'sms',
        status: 'delivered'
      }
    ];

    // 初回のみデータ投入
    if (this.getApplicants().length === 0) {
      localStorage.setItem(this.STORAGE_KEYS.applicants, JSON.stringify(sampleApplicants));
      localStorage.setItem(this.STORAGE_KEYS.messages, JSON.stringify(sampleMessages));
    }
  }

  // デモデータリセット
  static resetDemoData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initializeDemoData();
    
    window.dispatchEvent(new CustomEvent('demo-data-reset'));
  }

  // リアルタイム管理画面用データストリーム
  static subscribeToUpdates(callback: (event: CustomEvent) => void): () => void {
    const events = ['demo-data-updated', 'demo-message-added', 'demo-data-reset'];
    
    events.forEach(event => {
      window.addEventListener(event, callback as EventListener);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, callback as EventListener);
      });
    };
  }
}

// 統一されたデモ申請者インターフェース
export interface UnifiedApplicant {
  id: string;
  // 電話受付情報
  phoneInfo?: {
    phoneNumber: string;
    name: string;
    calledAt: string;
    smsStatus: 'sent' | 'pending' | 'failed';
  };
  // 面接情報
  interviewInfo?: {
    startedAt: string;
    completedAt?: string;
    responses: Array<{
      question: string;
      answer: string;
      timestamp: string;
    }>;
    status: 'not_started' | 'in_progress' | 'completed';
  };
  // 申込フォーム情報
  personalInfo?: {
    fullName: string;
    furigana: string;
    email: string;
    phoneNumber: string;
    age: string;
    address: string;
    desiredPosition?: string;
    experience?: string;
    motivation?: string;
    availableStartDate?: string;
    emergencyContact: string;
    emergencyPhone: string;
    hasLicense: boolean;
    licenseType: string;
    agreedToTerms: boolean;
  };
  // 審査情報
  status: 'phone_received' | 'interview_started' | 'application_completed' | 'pending_review' | 'approved' | 'rejected';
  appliedAt: string;
  notes?: string;
  reviewDate?: string;
  finalInterviewDate?: string;
}

// SMS送信履歴
export interface SmsHistory {
  id: string;
  applicantId: string;
  phoneNumber: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
  type: 'interview_invitation' | 'app_received' | 'interview_reminder' | 'final_interview_invitation';
}

// 統一されたデモストレージクラス
class UnifiedDemoStorage {
  private static STORAGE_KEYS = {
    applicants: 'unified_demo_applicants',
    smsHistory: 'unified_demo_sms_history',
    stats: 'unified_demo_stats'
  };

  // 申請者追加・更新
  addOrUpdateApplicant(applicant: UnifiedApplicant): void {
    const applicants = this.getApplicants();
    const existingIndex = applicants.findIndex(a => a.id === applicant.id);
    
    if (existingIndex >= 0) {
      applicants[existingIndex] = { ...applicants[existingIndex], ...applicant };
    } else {
      applicants.push(applicant);
    }
    
    localStorage.setItem(UnifiedDemoStorage.STORAGE_KEYS.applicants, JSON.stringify(applicants));
    this.updateStats();
    
    // リアルタイム更新イベント
    window.dispatchEvent(new CustomEvent('demo-data-updated', {
      detail: { 
        type: existingIndex >= 0 ? 'applicant_updated' : 'applicant_added', 
        data: applicant 
      }
    }));
  }

  // 申請者取得
  getApplicants(): UnifiedApplicant[] {
    const stored = localStorage.getItem(UnifiedDemoStorage.STORAGE_KEYS.applicants);
    return stored ? JSON.parse(stored) : [];
  }

  getApplicant(id: string): UnifiedApplicant | null {
    const applicants = this.getApplicants();
    return applicants.find(a => a.id === id) || null;
  }

  // 電話受付情報追加
  addPhoneContact(id: string, phoneNumber: string, name: string): void {
    const applicant: UnifiedApplicant = {
      id,
      phoneInfo: {
        phoneNumber,
        name,
        calledAt: new Date().toISOString(),
        smsStatus: 'pending'
      },
      status: 'phone_received',
      appliedAt: new Date().toISOString()
    };
    
    this.addOrUpdateApplicant(applicant);
  }

  // 面接開始
  startInterview(id: string): void {
    const applicant = this.getApplicant(id);
    if (applicant) {
      applicant.interviewInfo = {
        startedAt: new Date().toISOString(),
        responses: [],
        status: 'in_progress'
      };
      applicant.status = 'interview_started';
      this.addOrUpdateApplicant(applicant);
    }
  }

  // 面接回答追加
  addInterviewResponse(id: string, question: string, answer: string): void {
    const applicant = this.getApplicant(id);
    if (applicant?.interviewInfo) {
      applicant.interviewInfo.responses.push({
        question,
        answer,
        timestamp: new Date().toISOString()
      });
      this.addOrUpdateApplicant(applicant);
    }
  }

  // 面接完了
  completeInterview(id: string): void {
    const applicant = this.getApplicant(id);
    if (applicant?.interviewInfo) {
      applicant.interviewInfo.completedAt = new Date().toISOString();
      applicant.interviewInfo.status = 'completed';
      applicant.status = 'application_completed';
      this.addOrUpdateApplicant(applicant);
    }
  }

  // 申込フォーム完了
  completeApplication(id: string, personalInfo: UnifiedApplicant['personalInfo']): void {
    const applicant = this.getApplicant(id);
    if (applicant) {
      applicant.personalInfo = personalInfo;
      applicant.status = 'pending_review';
      this.addOrUpdateApplicant(applicant);
    }
  }

  // 審査ステータス更新
  updateReviewStatus(id: string, status: 'approved' | 'rejected', notes?: string, finalInterviewDate?: string): void {
    const applicant = this.getApplicant(id);
    if (applicant) {
      applicant.status = status;
      applicant.notes = notes;
      applicant.reviewDate = new Date().toISOString();
      applicant.finalInterviewDate = finalInterviewDate;
      this.addOrUpdateApplicant(applicant);
    }
  }

  // SMS履歴管理
  addSmsHistory(sms: Omit<SmsHistory, 'id' | 'sentAt'>): void {
    const history = this.getSmsHistory();
    const newSms: SmsHistory = {
      id: `sms_${Date.now()}`,
      sentAt: new Date().toISOString(),
      ...sms
    };
    
    history.unshift(newSms);
    localStorage.setItem(UnifiedDemoStorage.STORAGE_KEYS.smsHistory, JSON.stringify(history.slice(0, 100)));
    
    // SMS送信時に申請者のSMSステータス更新
    const applicant = this.getApplicant(sms.applicantId);
    if (applicant?.phoneInfo) {
      applicant.phoneInfo.smsStatus = sms.status;
      this.addOrUpdateApplicant(applicant);
    }

    // SMS送信イベント
    window.dispatchEvent(new CustomEvent('demo-sms-sent', {
      detail: newSms
    }));
  }

  getSmsHistory(): SmsHistory[] {
    const stored = localStorage.getItem(UnifiedDemoStorage.STORAGE_KEYS.smsHistory);
    return stored ? JSON.parse(stored) : [];
  }

  // 統計情報更新
  updateStats(): void {
    const applicants = this.getApplicants();
    const smsHistory = this.getSmsHistory();
    
    const stats = {
      total: applicants.length,
      phoneReceived: applicants.filter(a => a.status === 'phone_received').length,
      interviewStarted: applicants.filter(a => a.status === 'interview_started').length,
      applicationCompleted: applicants.filter(a => a.status === 'application_completed').length,
      pendingReview: applicants.filter(a => a.status === 'pending_review').length,
      approved: applicants.filter(a => a.status === 'approved').length,
      rejected: applicants.filter(a => a.status === 'rejected').length,
      smsToday: smsHistory.filter(s => {
        const today = new Date().toDateString();
        const smsDate = new Date(s.sentAt).toDateString();
        return today === smsDate;
      }).length,
      smsTotal: smsHistory.length
    };
    
    localStorage.setItem(UnifiedDemoStorage.STORAGE_KEYS.stats, JSON.stringify(stats));
    
    // 統計更新イベント
    window.dispatchEvent(new CustomEvent('demo-stats-updated', {
      detail: stats
    }));
  }

  getStats() {
    const stored = localStorage.getItem(UnifiedDemoStorage.STORAGE_KEYS.stats);
    return stored ? JSON.parse(stored) : {
      total: 0,
      phoneReceived: 0,
      interviewStarted: 0,
      applicationCompleted: 0,
      pendingReview: 0,
      approved: 0,
      rejected: 0,
      smsToday: 0,
      smsTotal: 0
    };
  }

  // データクリア
  clearAllData(): void {
    Object.values(UnifiedDemoStorage.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    window.dispatchEvent(new CustomEvent('demo-data-updated', {
      detail: { type: 'data_cleared' }
    }));
  }

  // レガシーデータ移行（互換性のため）
  migrateFromOldStorage(): void {
    // 旧システムからのデータ移行処理
    const oldApplicants = localStorage.getItem('separated_demo_applicants');
    const oldDemoApplicants = localStorage.getItem('demo_applicants');
    
    if (oldApplicants || oldDemoApplicants) {
      console.log('🔄 旧データを新システムに移行中...');
      // 移行処理はここに実装
      this.updateStats();
    }
  }
}

// シングルトンインスタンス
export const demoStorage = new UnifiedDemoStorage();

// 初期化時にレガシーデータを移行
demoStorage.migrateFromOldStorage();
export default DemoStorage;