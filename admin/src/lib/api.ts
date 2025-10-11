import type { Applicant, ApplicantFilters, AvailableSlot } from '@/types/applicant'

const API_BASE_URL = import.meta.env.VITE_GAS_API_URL || ''

// エラーハンドリング
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(
      `API Error: ${response.statusText}`,
      response.status
    )
  }
  return response.json()
}

// 応募者一覧取得
export async function getApplicants(filters?: ApplicantFilters): Promise<Applicant[]> {
  const params = new URLSearchParams()
  params.append('action', 'getApplicants')
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.append(key, String(value))
      }
    })
  }
  
  const response = await fetch(`${API_BASE_URL}?${params.toString()}`)
  return handleResponse<Applicant[]>(response)
}

// 応募者詳細取得
export async function getApplicantDetail(id: string): Promise<Applicant> {
  const params = new URLSearchParams({
    action: 'getApplicantDetail',
    id,
  })
  
  const response = await fetch(`${API_BASE_URL}?${params.toString()}`)
  return handleResponse<Applicant>(response)
}

// 応募者ステータス更新
export async function updateApplicantStatus(
  id: string,
  status: string,
  notes?: string
): Promise<{ success: boolean }> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'updateApplicantStatus',
      id,
      status,
      notes,
    }),
  })
  
  return handleResponse<{ success: boolean }>(response)
}

// カレンダー空き枠取得
export async function getAvailableSlots(
  startDate: string,
  endDate: string
): Promise<AvailableSlot[]> {
  const params = new URLSearchParams({
    action: 'getAvailableSlots',
    startDate,
    endDate,
  })
  
  const response = await fetch(`${API_BASE_URL}?${params.toString()}`)
  return handleResponse<AvailableSlot[]>(response)
}

// 面接予約登録
export async function scheduleInterview(
  applicantId: string,
  date: string,
  time: string
): Promise<{ success: boolean; eventId: string }> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'scheduleInterview',
      applicantId,
      date,
      time,
    }),
  })
  
  return handleResponse<{ success: boolean; eventId: string }>(response)
}

// 通知送信
export async function sendNotification(
  applicantId: string,
  type: 'email' | 'sms',
  template: string
): Promise<{ success: boolean }> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'sendNotification',
      applicantId,
      type,
      template,
    }),
  })
  
  return handleResponse<{ success: boolean }>(response)
}

// モックデータ（開発用）
export const mockApplicants: Applicant[] = [
  {
    id: '1',
    timestamp: '2025-01-11 10:30:00',
    applicantName: '山田太郎',
    phoneNumber: '+81901234567',
    applicationSource: 'AI面接チャットbot',
    step1_answer: 'Indeed',
    step2_answer: 'いいえ、該当しません',
    step3_answer: '長期勤務を希望します',
    step4_answer: '人々の安全を守る仕事に興味があり、ALSOKの理念に共感しました',
    step5_answer: '体力には自信があり、夜勤も問題ありません',
    step6_answer: '接客業経験5年、普通自動車免許保有',
    step7_answer: '施設警備、イベント警備など幅広い業務があると理解しています',
    step8_answer: '責任の重さを理解し、真摯に取り組みます',
    step9_answer: '警備員検定の取得を目指したいです',
    step10_answer: 'チームワークと職場の雰囲気を重視します',
    step11_answer: '御社が第一志望です',
    step12_answer: '研修制度について詳しく知りたいです',
    qualificationStatus: '適格性高い',
    overallResult: '面接推奨',
    completionTime: '2025-01-11 10:45:00',
    deviceType: 'スマートフォン',
    status: 'screening_completed',
  },
  {
    id: '2',
    timestamp: '2025-01-11 14:20:00',
    applicantName: '佐藤花子',
    phoneNumber: '+81908765432',
    applicationSource: 'AI面接チャットbot',
    step1_answer: 'タウンワーク',
    step2_answer: 'いいえ',
    step3_answer: 'まずは短期から始めたい',
    step4_answer: '安定した仕事を探しています',
    step5_answer: '普通の体力だと思います',
    step6_answer: '特になし',
    step7_answer: '警備の仕事だと思います',
    step8_answer: '頑張ります',
    step9_answer: '必要なら受けます',
    step10_answer: '給与',
    step11_answer: '他も見ています',
    step12_answer: '特にありません',
    qualificationStatus: '要確認',
    overallResult: '要検討',
    completionTime: '2025-01-11 14:35:00',
    deviceType: 'PC',
    status: 'under_review',
  },
  {
    id: '3',
    timestamp: '2025-01-10 09:15:00',
    applicantName: '鈴木一郎',
    phoneNumber: '+81909876543',
    applicationSource: 'AI面接チャットbot',
    step1_answer: 'ハローワーク',
    step2_answer: 'いいえ、該当しません',
    step3_answer: '長期で働きたいです',
    step4_answer: '地域の安全に貢献したいと考えています。警備の仕事は社会的意義が高いと感じました。',
    step5_answer: '前職で夜勤経験があり、体力面は問題ありません',
    step6_answer: '運送業10年、大型免許・フォークリフト免許保有',
    step7_answer: '施設の巡回や受付業務、緊急時の対応などがあると理解しています',
    step8_answer: '安全を守る責任の重さを十分理解しており、常に気を引き締めて対応します',
    step9_answer: '施設警備検定1級を取得したいです',
    step10_answer: '教育体制と長期的なキャリアパス',
    step11_answer: 'ALSOKを第一志望としています',
    step12_answer: 'キャリアアップの仕組みについて教えていただきたいです',
    qualificationStatus: '適格性高い',
    overallResult: '面接推奨',
    completionTime: '2025-01-10 09:40:00',
    deviceType: 'スマートフォン',
    status: 'qualified',
  },
]
