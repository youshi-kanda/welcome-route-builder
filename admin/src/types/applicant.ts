// 応募者のステータス
export type ApplicantStatus = 
  | 'screening_completed'    // 審査完了（初期状態）
  | 'under_review'          // 人事審査中
  | 'qualified'             // 合格
  | 'disqualified'          // 不合格
  | 'interview_scheduled'   // 面接予約済み
  | 'interview_completed'   // 面接完了
  | 'hired'                 // 採用決定
  | 'rejected'              // 最終不採用

// 適格性判定（GASからの自動判定）
export type QualificationStatus = '要確認' | '適格の可能性あり' | '適格性高い'

// 応募者データ
export interface Applicant {
  id: string
  timestamp: string
  applicantName: string
  phoneNumber: string
  applicationSource: string
  
  // 12ステップの回答
  step1_answer: string  // Q1_応募経路詳細
  step2_answer: string  // Q2_欠格事由確認
  step3_answer: string  // Q3_勤務期間希望
  step4_answer: string  // Q4_志望動機・応募理由
  step5_answer: string  // Q5_体力面・業務対応
  step6_answer: string  // Q6_経験・スキル・資格
  step7_answer: string  // Q7_仕事内容理解度
  step8_answer: string  // Q8_責任の重さ認識
  step9_answer: string  // Q9_研修・資格意欲
  step10_answer: string // Q10_重視する点
  step11_answer: string // Q11_他社検討状況
  step12_answer: string // Q12_面接準備・質問
  
  qualificationStatus: QualificationStatus
  overallResult: string
  completionTime: string
  deviceType: string
  userAgent?: string
  
  // 管理画面で追加するフィールド
  status: ApplicantStatus
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  interviewDate?: string
  interviewTime?: string
  calendarEventId?: string
  notificationSent?: boolean
  notificationSentAt?: string
}

// フィルター条件
export interface ApplicantFilters {
  startDate?: string
  endDate?: string
  status?: ApplicantStatus | 'all'
  qualificationStatus?: QualificationStatus | 'all'
  searchQuery?: string
}

// カレンダー空き枠
export interface AvailableSlot {
  date: string
  startTime: string
  endTime: string
  time?: string  // HH:mm形式の時刻
  available?: boolean
}

// 通知テンプレート
export interface NotificationTemplate {
  id: string
  type: 'email' | 'sms'
  purpose: 'qualification' | 'disqualification' | 'reminder'
  subject?: string
  body: string
}
