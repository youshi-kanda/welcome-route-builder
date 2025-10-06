// API configuration and utilities
const API_BASE = import.meta.env.VITE_API_BASE || "https://api.example.workers.dev";
const API_TIMEOUT = 10000; // 10 seconds

export interface SendSmsRequest {
  to: string;
  templateId: "receipt" | "reserve" | "remind";
  variables: Record<string, string>;
}

export interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsLog {
  id: string;
  to: string;
  templateId: string;
  body: string;
  status: "queued" | "sent" | "failed" | "delivered";
  timestamp: string;
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || "エラーが発生しました",
          response.status,
          errorData
        );
      }

      return await response.json();
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
  sendSms: (data: SendSmsRequest) =>
    apiCall<SendSmsResponse>("/api/sms/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),

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
    return apiCall<SmsLogsResponse>(
      `/api/sms/logs?${searchParams.toString()}`
    );
  },
};

// Mock data for development
export const mockSmsLogs: SmsLog[] = [
  {
    id: "1",
    to: "+81 90 1234 5678",
    templateId: "receipt",
    body: "山田様、応募ありがとうございます。事前確認はこちら→ https://example.com/chat",
    status: "delivered",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "2",
    to: "+81 80 9876 5432",
    templateId: "reserve",
    body: "佐藤様、面接候補日時の選択はこちら→ https://example.com/reserve",
    status: "sent",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "3",
    to: "+81 70 1111 2222",
    templateId: "remind",
    body: "明日2025/01/15 10:00に面接予定です。詳細→ https://example.com",
    status: "failed",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    error: "Invalid phone number",
  },
];
