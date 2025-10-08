import emailjs from '@emailjs/browser';

// EmailJS設定 (デモ用公開設定)
const DEMO_EMAIL_CONFIG = {
  SERVICE_ID: 'service_demo_alsok',
  TEMPLATE_ID: 'template_sms_notification', 
  PUBLIC_KEY: 'demo_public_key_12345'
};

export interface EmailNotification {
  to: string;
  smsContent: string;
  phoneNumber: string;
  timestamp: string;
  templateType: string;
  applicantId?: string;
  demoUrl?: string;
}

export interface EmailSetup {
  isEnabled: boolean;
  recipientEmail: string;
  senderName?: string;
}

class EmailService {
  private static instance: EmailService;
  private isInitialized = false;
  private emailSetup: EmailSetup = {
    isEnabled: false,
    recipientEmail: '',
    senderName: 'ALSOK面接システム'
  };

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // EmailJS初期化 (デモ用モック)
  async initialize(): Promise<boolean> {
    try {
      // デモモードでは実際のEmailJSを使わずにモック処理
      const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
      
      if (DEMO_MODE) {
        console.log('[Demo] EmailJS initialized (mock mode)');
        this.isInitialized = true;
        return true;
      }

      // 本番用: 実際のEmailJS初期化
      // emailjs.init(DEMO_EMAIL_CONFIG.PUBLIC_KEY);
      // this.isInitialized = true;
      
      return true;
    } catch (error) {
      console.error('EmailJS initialization failed:', error);
      return false;
    }
  }

  // メール設定の更新
  updateEmailSetup(setup: Partial<EmailSetup>): void {
    this.emailSetup = { ...this.emailSetup, ...setup };
    
    // ローカルストレージに保存
    localStorage.setItem('demo_email_setup', JSON.stringify(this.emailSetup));
    
    // 設定変更イベント発火
    window.dispatchEvent(new CustomEvent('demo-email-setup-changed', {
      detail: this.emailSetup
    }));
  }

  // メール設定の取得
  getEmailSetup(): EmailSetup {
    try {
      const stored = localStorage.getItem('demo_email_setup');
      if (stored) {
        this.emailSetup = { ...this.emailSetup, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load email setup:', error);
    }
    
    return this.emailSetup;
  }

  // SMS通知メール送信
  async sendSmsNotification(notification: EmailNotification): Promise<boolean> {
    if (!this.emailSetup.isEnabled || !this.emailSetup.recipientEmail) {
      console.log('[Demo] Email notification skipped - not configured');
      return false;
    }

    const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
    
    if (DEMO_MODE) {
      return this.mockEmailSend(notification);
    }

    try {
      // 本番用: 実際のメール送信
      const templateParams = {
        to_email: this.emailSetup.recipientEmail,
        sender_name: this.emailSetup.senderName,
        phone_number: notification.phoneNumber,
        sms_content: notification.smsContent,
        timestamp: notification.timestamp,
        template_type: notification.templateType,
        applicant_id: notification.applicantId || '未設定',
        demo_url: notification.demoUrl || window.location.origin,
        subject: `📱 SMS送信通知 - ${notification.templateType}`
      };

      const result = await emailjs.send(
        DEMO_EMAIL_CONFIG.SERVICE_ID,
        DEMO_EMAIL_CONFIG.TEMPLATE_ID,
        templateParams,
        DEMO_EMAIL_CONFIG.PUBLIC_KEY
      );

      console.log('Email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  // デモ用モックメール送信
  private async mockEmailSend(notification: EmailNotification): Promise<boolean> {
    // リアルな遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1200));

    // メール内容を生成
    const emailContent = this.generateEmailContent(notification);
    
    // デモ用メール送信イベント発火
    window.dispatchEvent(new CustomEvent('demo-email-sent', {
      detail: {
        to: this.emailSetup.recipientEmail,
        subject: `📱 SMS送信通知 - ${notification.templateType}`,
        content: emailContent,
        timestamp: new Date().toLocaleString('ja-JP'),
        notification
      }
    }));

    console.log('[Demo] Email sent (mock):', {
      to: this.emailSetup.recipientEmail,
      type: notification.templateType,
      phone: notification.phoneNumber
    });

    return true;
  }

  // メール本文生成
  private generateEmailContent(notification: EmailNotification): string {
    const templateTypeMap: Record<string, string> = {
      'app_received': '応募受付確認',
      'chat_completed': '事前質問完了',
      '2nd_schedule': '二次面接日程案内',
      '2nd_confirmed': '二次面接確定通知',
      'reminder': '面接リマインダー'
    };

    return `
━━━━━━━━━━━━━━━━━━━━
📱 ALSOK面接システム - SMS送信通知
━━━━━━━━━━━━━━━━━━━━

🕒 送信時刻: ${notification.timestamp}
📞 送信先: ${notification.phoneNumber}
👤 応募者ID: ${notification.applicantId || '未設定'}
📋 通知種別: ${templateTypeMap[notification.templateType] || notification.templateType}

💬 SMS内容:
${notification.smsContent}

━━━━━━━━━━━━━━━━━━━━
🔗 デモ画面: ${notification.demoUrl || window.location.origin}
━━━━━━━━━━━━━━━━━━━━

※ これはデモ用の通知メールです
※ 実際のSMS送信は行われていません
    `.trim();
  }

  // 汎用メール送信（2次審査連絡用）
  async sendEmail(params: {
    to: string;
    subject: string;
    htmlContent: string;
    textContent: string;
  }): Promise<boolean> {
    const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
    
    if (DEMO_MODE) {
      // デモ用モック送信
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('[Demo] Email sent (mock):', {
        to: params.to,
        subject: params.subject,
        timestamp: new Date().toLocaleString('ja-JP')
      });
      
      // イベント発火
      window.dispatchEvent(new CustomEvent('demo-email-sent', {
        detail: {
          to: params.to,
          subject: params.subject,
          content: params.htmlContent,
          timestamp: new Date().toLocaleString('ja-JP'),
          type: 'secondary_interview'
        }
      }));
      
      return true;
    }
    
    // 本番用実装はここに追加
    return true;
  }

  // テストメール送信
  async sendTestEmail(): Promise<boolean> {
    const testNotification: EmailNotification = {
      to: this.emailSetup.recipientEmail,
      smsContent: 'これはテスト用のSMS内容です。ALSOK面接システムからの通知をシミュレートしています。',
      phoneNumber: '+819012345678',
      timestamp: new Date().toLocaleString('ja-JP'),
      templateType: 'test',
      applicantId: 'TEST_001',
      demoUrl: window.location.origin
    };

    return this.sendSmsNotification(testNotification);
  }
}

// シングルトンインスタンスをエクスポート
export const emailService = EmailService.getInstance();
export default EmailService;