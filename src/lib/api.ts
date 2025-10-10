// ALSOK面接システム - API configuration and utilities
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8787";
const API_TIMEOUT = 10000; // 10 seconds
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
// デモ中の操作を実データ（GAS経由など）へ反映するかどうか
// .env.local に VITE_DEMO_PERSIST=true を設定すると有効
const DEMO_PERSIST = import.meta.env.VITE_DEMO_PERSIST === 'true';

// デバッグログ
const debugLog = (message: string, data?: unknown) => {
  if (DEBUG_MODE) {
    console.log(`[ALSOK API] ${message}`, data);
  }
};

// ALSOK API インターフェース定義
export interface ApplicationRequest {
  name?: string;
  phone: string;
  source?: string;
  consent_flg: boolean;
  notes?: string;
}

export interface ApplicationResponse {
  ok: boolean;
  applicant_id: string;
  error?: string;
}

export interface SendSmsRequest {
  to: string;
  templateId?: "app_received" | "chat_completed" | "2nd_schedule" | "2nd_confirmed" | "reminder";
  variables?: Record<string, string>;
  body?: string;
  applicant_id?: string;
}

export interface SendSmsResponse {
  ok: boolean;
  sid: string;
  status: string;
  error?: string;
}

export interface InterviewSlotRequest {
  interviewer_id: string;
}

export interface InterviewSlotResponse {
  ok: boolean;
  slotAt: string | null;
  error?: string;
}

export interface SmsLog {
  id: string;
  applicant_id: string;
  at: string;
  channel: 'sms' | 'call' | 'email' | 'note';
  direction: 'in' | 'out' | 'sys';
  content: string;
  operator: string;
  to?: string;
  templateId?: string;
  status?: "queued" | "sent" | "failed" | "delivered";
  error?: string;
}

export interface SmsLogsResponse {
  logs: SmsLog[];
  total: number;
  hasMore: boolean;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("タイムアウトしました。再試行してください。");
    }
    throw error;
  }
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 1
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      debugLog(`API Call: ${options.method || 'GET'} ${endpoint}`, options.body ? JSON.parse(options.body as string) : undefined);
      
      const response = await fetchWithTimeout(
        url,
        {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        },
        API_TIMEOUT
      );

      const responseData = await response.json();
      debugLog(`API Response: ${response.status}`, responseData);

      if (!response.ok) {
        throw new ApiError(
          responseData.error || "エラーが発生しました",
          response.status,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      if (attempt === retries) {
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError(
          "通信に失敗しました。時間をおいて再試行してください。"
        );
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new ApiError("通信に失敗しました");
}

export const api = {
  // 応募受付API
  submitApplication: (data: ApplicationRequest) => {
    debugLog('Submitting application', data);
    
    // デモモード: 完全なモック処理
    if (DEMO_MODE) {
      return mockApplicationResponse(data);
    }
    
    return apiCall<ApplicationResponse>("/api/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // SMS送信API
  sendSms: (data: SendSmsRequest) => {
    debugLog('Sending SMS', data);
    
    // デモモード: モックレスポンスを返す
    if (DEMO_MODE) {
      return mockSmsResponse(data);
    }
    
    return apiCall<SendSmsResponse>("/api/sms/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // 次の空き枠取得API
  getNextSlot: (data: InterviewSlotRequest) => {
    debugLog('Getting next slot', data);
    
    // デモモード: Calendar連携モック
    if (DEMO_MODE) {
      return mockNextSlotResponse(data);
    }
    
    return apiCall<InterviewSlotResponse>("/api/second/next-slot", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // SMS ログ取得API（既存のSMSログ管理用）
  getSmsLogs: (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    templateId?: string;
    offset?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    debugLog('Getting SMS logs', params);
    
    // デモモード: ローカルストレージから取得
    if (DEMO_MODE) {
      return mockSmsLogsResponse(params);
    }
    
    return apiCall<SmsLogsResponse>(
      `/api/sms/logs?${searchParams.toString()}`
    );
  },

  // 管理者用API（Phase2）
  getInterviewers: () => {
    debugLog('Getting interviewers');
    return apiCall<{interviewers: {id: string; name: string}[]}>("/api/interviewers");
  },

  updateDecision: (data: {
    applicant_id: string;
    decision: 'pass' | 'hold' | 'fail';
    decided_by: string;
    memo?: string;
  }) => {
    debugLog('Updating decision', data);
    return apiCall<{ok: boolean, updated: boolean}>("/api/decisions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ALSOK用 Mock data for development
export const mockSmsLogs: SmsLog[] = [
  {
    id: "msg_001",
    applicant_id: "app_001", 
    at: new Date(Date.now() - 3600000).toISOString(),
    channel: "sms",
    direction: "out",
    content: "山田様、ALSOK採用チームです。応募を受け付けました。受付番号：app_001。追ってご連絡いたします。",
    operator: "system",
    to: "+819012345678",
    templateId: "app_received",
    status: "delivered",
  },
  {
    id: "msg_002",
    applicant_id: "app_002",
    at: new Date(Date.now() - 7200000).toISOString(), 
    channel: "sms",
    direction: "out",
    content: "佐藤様、事前質問にご回答ありがとうございました。二次面接の詳細を後日ご連絡いたします。",
    operator: "system",
    to: "+818098765432",
    templateId: "chat_completed",
    status: "sent",
  },
  {
    id: "msg_003",
    applicant_id: "app_003",
    at: new Date(Date.now() - 10800000).toISOString(),
    channel: "sms", 
    direction: "out",
    content: "【二次面接のご案内】田中様、2025年1月15日(水) 14:00–15:00 で予定いたします。よろしければ「1」と返信、変更は「2」と返信ください。",
    operator: "system",
    to: "+817011112222",
    templateId: "2nd_schedule",
    status: "failed",
    error: "Invalid phone number",
  },
  {
    id: "msg_004",
    applicant_id: "app_003",
    at: new Date(Date.now() - 10700000).toISOString(),
    channel: "sms",
    direction: "in", 
    content: "1",
    operator: "",
    to: "+817011112222",
  },
  {
    id: "msg_005",
    applicant_id: "app_003",
    at: new Date(Date.now() - 10600000).toISOString(),
    channel: "sms",
    direction: "out",
    content: "田中様、2025年1月15日(水) 14:00–15:00 で二次面接が確定しました。場所：ALSOK本社 3F会議室",
    operator: "system",
    to: "+817011112222",
    templateId: "2nd_confirmed",
    status: "delivered",
  },
];

// デモ用SMS送信モック
export const mockSmsResponse = async (data: SendSmsRequest): Promise<SendSmsResponse> => {
  // 実際のSMS送信をシミュレート（遅延付き）
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const smsContent = generateSmsContent(data);
  
  return {
    ok: true,
    sid: `DEMO${generateId()}`,
    status: 'delivered'
  };
};

// SMS内容生成（テンプレート処理）
const generateSmsContent = (data: SendSmsRequest): string => {
  if (data.body) return data.body;
  
  const templates = {
    'app_received': '{NAME}様、ALSOK採用チームです。応募を受け付けました。受付番号：{APPLICANT_ID}。追ってご連絡いたします。',
    'chat_completed': '{NAME}様、事前質問にご回答ありがとうございました。二次面接の詳細を後日ご連絡いたします。',
    '2nd_schedule': '【二次面接のご案内】{NAME}様、{DATE_JP} {START}–{END} で予定いたします。よろしければ「1」と返信、変更は「2」と返信ください。',
    '2nd_confirmed': '{NAME}様、{DATE_JP} {START}–{END} で二次面接が確定しました。場所：ALSOK本社 3F会議室',
    'reminder': '【リマインダー】{NAME}様、明日 {START} から面接予定です。ALSOK本社 3F会議室でお待ちしております。'
  };
  
  let content = templates[data.templateId as keyof typeof templates] || 'デモ用SMSメッセージです。';
  
  // 変数置換
  if (data.variables) {
    Object.entries(data.variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{${key}}`, 'g'), value);
    });
  }
  
  return content;
};

// デモ用応募受付モック
export const mockApplicationResponse = async (data: ApplicationRequest): Promise<ApplicationResponse> => {
  // リアルな遅延をシミュレート
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const applicantId = `DEMO_${Date.now().toString(36).toUpperCase()}`;
  
  // オプション: デモ操作を実際の API にバックグラウンド保存する
  if (DEMO_PERSIST) {
    // fire-and-forget で本番/ステージングの API に POST する
    (async () => {
      try {
        const persistUrl = `${API_BASE}/api/applications`;
        await fetch(persistUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, applicant_id: applicantId })
        });
        debugLog('DEMO_PERSIST: persisted application to real API', { url: persistUrl, applicantId });
      } catch (e) {
        debugLog('DEMO_PERSIST: failed to persist application', e);
      }
    })();
  }

  return {
    ok: true,
    applicant_id: applicantId
  };
};

// デモ用面接枠取得モック
export const mockNextSlotResponse = async (data: InterviewSlotRequest): Promise<InterviewSlotResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 明日の14:00を提案
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  
  return {
    ok: true,
    slotAt: tomorrow.toISOString()
  };
};

// デモ用SMSログモック
export const mockSmsLogsResponse = async (params?: Record<string, unknown>): Promise<SmsLogsResponse> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 静的なモックデータを返す
  const logs: SmsLog[] = mockSmsLogs.filter(log => {
    if (params?.status && log.status !== params.status) return false;
    if (params?.templateId && log.templateId !== params.templateId) return false;
    return true;
  });
  
  return {
    logs,
    total: logs.length,
    hasMore: false
  };
};

// エラーハンドリングヘルパー
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return '入力内容に不備があります。';
      case 401:
        return '認証が必要です。';
      case 403:
        return 'アクセス権限がありません。';
      case 429:
        return 'しばらく時間をおいてから再度お試しください。';
      case 500:
        return 'サーバーエラーが発生しました。';
      default:
        return error.message;
    }
  }
  
  return '予期しないエラーが発生しました。';
};

// ULID生成（簡易版）
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export { ApiError };
