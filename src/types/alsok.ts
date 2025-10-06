// ALSOK面接システム - 型定義

export interface Applicant {
  applicant_id: string;
  created_at: string;
  name: string;
  phone: string;
  source: string;
  consent_flg: boolean;
  status: 'pending' | 'pass' | 'hold' | 'fail' | '2nd_pending' | '2nd_booked';
  owner: string;
  notes: string;
  next_action_at: string;
}

export interface Message {
  id: string;
  applicant_id: string;
  at: string;
  channel: 'sms' | 'call' | 'email' | 'note';
  direction: 'in' | 'out' | 'sys';
  content: string;
  operator: string;
}

export interface Decision {
  applicant_id: string;
  decided_at: string;
  decision: 'pass' | 'hold' | 'fail';
  decided_by: string;
  memo: string;
}

export interface Interviewer {
  interviewer_id: string;
  name: string;
  email: string;
  calendar_id: string;
  workday: string;
  start_hour: number;
  end_hour: number;
  tz: string;
}

export interface Question {
  id: number;
  step: number;
  text: string;
  type: 'text' | 'number' | 'choice' | 'date';
  choices: string;
  required: boolean;
  next_if_yes: number | null;
  next_if_no: number | null;
  version: string;
  active: boolean;
}

export interface Template {
  template_id: string;
  body: string;
}

export interface OpsSettings {
  key: string;
  value: string;
}

// API レスポンス型
export interface ALSOKApiResponse<T = any> {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

// フロントエンド専用の型
export interface InterviewSlot {
  slotAt: string;
  interviewer_id: string;
  available: boolean;
}

export interface UserSession {
  applicant_id: string;
  phone: string;
  name?: string;
  current_step: 'application' | 'chat' | 'reserve' | 'completed';
  created_at: string;
}