/**
 * システム設定の型定義
 */
export interface SystemSettings {
  // Google Calendar設定
  calendarId: string;
  calendarEnabled: boolean;
  
  // Twilio設定
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  twilioEnabled: boolean;
  
  // メール通知設定
  emailEnabled: boolean;
  emailFrom: string;
  
  // 通知テンプレート
  qualifiedEmailTemplate: string;
  rejectedEmailTemplate: string;
  interviewReminderTemplate: string;
  qualifiedSmsTemplate: string;
  interviewSmsTemplate: string;
}

/**
 * 設定セクション定義
 */
export interface SettingSection {
  title: string;
  description: string;
  icon: string;
}

/**
 * 設定フィールド定義
 */
export interface SettingField {
  key: keyof SystemSettings;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'checkbox' | 'email';
  placeholder?: string;
  description?: string;
  required?: boolean;
  rows?: number; // textarea用
}
