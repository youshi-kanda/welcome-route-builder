// 2次審査連絡システム
import { emailService } from './emailService';

export interface SecondaryInterviewNotification {
  applicantName: string;
  applicantEmail: string;
  interviewDate: string;
  interviewTime: string;
  location: string;
  interviewer: string;
  notes?: string;
}

export interface InterviewSchedule {
  date: string;
  time: string;
  location: string;
  interviewer: string;
  maxCapacity: number;
  currentBookings: number;
}

class SecondaryInterviewService {
  // 面接スケジュールのテンプレート
  private scheduleTemplates: InterviewSchedule[] = [
    {
      date: this.getNextWeekday(1), // 来週月曜日
      time: '10:00-11:00',
      location: 'ALSOK本社 会議室A',
      interviewer: '人事部 田中部長',
      maxCapacity: 5,
      currentBookings: 0
    },
    {
      date: this.getNextWeekday(1),
      time: '14:00-15:00', 
      location: 'ALSOK本社 会議室B',
      interviewer: '営業部 佐藤課長',
      maxCapacity: 5,
      currentBookings: 0
    },
    {
      date: this.getNextWeekday(3), // 来週水曜日
      time: '10:00-11:00',
      location: 'ALSOK本社 会議室A',
      interviewer: '技術部 山田課長',
      maxCapacity: 5,
      currentBookings: 0
    },
    {
      date: this.getNextWeekday(5), // 来週金曜日
      time: '15:00-16:00',
      location: 'ALSOK本社 会議室C',
      interviewer: '人事部 田中部長',
      maxCapacity: 5,
      currentBookings: 0
    }
  ];

  // 2次審査合格通知と面接案内を送信
  async sendSecondaryInterviewInvitation(
    applicantName: string,
    applicantEmail: string,
    selectedSchedule?: InterviewSchedule
  ): Promise<boolean> {
    try {
      // 面接スケジュールを自動選択または指定されたものを使用
      const schedule = selectedSchedule || this.getAvailableSchedule();
      
      if (!schedule) {
        throw new Error('利用可能な面接スケジュールがありません');
      }

      // メール内容を構築
      const emailContent = this.buildInterviewInvitationEmail({
        applicantName,
        applicantEmail,
        interviewDate: schedule.date,
        interviewTime: schedule.time,
        location: schedule.location,
        interviewer: schedule.interviewer
      });

      // メール送信
      await emailService.sendEmail({
        to: applicantEmail,
        subject: '【ALSOK】2次面接のご案内',
        htmlContent: emailContent.html,
        textContent: emailContent.text
      });

      // 面接スケジュールの予約数を更新
      this.updateScheduleBooking(schedule);

      console.log('✅ 2次面接案内送信完了:', { applicantName, applicantEmail, schedule });
      return true;
    } catch (error) {
      console.error('❌ 2次面接案内送信エラー:', error);
      return false;
    }
  }

  // 面接確認メールを送信
  async sendInterviewConfirmation(
    applicantName: string,
    applicantEmail: string,
    interviewDetails: SecondaryInterviewNotification
  ): Promise<boolean> {
    try {
      const emailContent = this.buildConfirmationEmail(interviewDetails);
      
      await emailService.sendEmail({
        to: applicantEmail,
        subject: '【ALSOK】面接日程確定のお知らせ',
        htmlContent: emailContent.html,
        textContent: emailContent.text
      });

      console.log('✅ 面接確認メール送信完了:', { applicantName, applicantEmail });
      return true;
    } catch (error) {
      console.error('❌ 面接確認メール送信エラー:', error);
      return false;
    }
  }

  // 利用可能な面接スケジュール取得
  getAvailableSchedules(): InterviewSchedule[] {
    return this.scheduleTemplates.filter(schedule => 
      schedule.currentBookings < schedule.maxCapacity
    );
  }

  // 次に利用可能なスケジュールを自動選択
  private getAvailableSchedule(): InterviewSchedule | null {
    const available = this.getAvailableSchedules();
    return available.length > 0 ? available[0] : null;
  }

  // 面接案内メールの内容構築
  private buildInterviewInvitationEmail(notification: SecondaryInterviewNotification) {
    const html = `
    <div style="font-family: 'Hiragino Sans', 'ヒラギノ角ゴシック', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 24px;">🎉 2次面接のご案内</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">ALSOK株式会社</p>
      </div>
      
      <div style="padding: 20px; line-height: 1.6;">
        <p><strong>${notification.applicantName}</strong> 様</p>
        
        <p>この度は、ALSOK株式会社の採用選考にご応募いただき、誠にありがとうございました。</p>
        
        <p>1次選考の結果、<strong style="color: #16a34a;">合格</strong>となりましたことをお知らせいたします。<br>
        つきましては、2次面接を実施させていただきたく、下記の通りご案内申し上げます。</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e3a8a; margin-top: 0;">📅 面接詳細</h3>
          <table style="width: 100%; border-spacing: 0;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 100px;">日時:</td><td>${notification.interviewDate} ${notification.interviewTime}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">場所:</td><td>${notification.location}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">面接官:</td><td>${notification.interviewer}</td></tr>
          </table>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #92400e; margin-top: 0;">📝 ご準備いただくもの</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>履歴書（写真貼付）</li>
            <li>職務経歴書</li>
            <li>身分証明書</li>
            <li>筆記用具</li>
          </ul>
        </div>
        
        <p><strong>ご参加の可否につきましては、3日以内にご返信ください。</strong></p>
        
        <p>ご不明な点がございましたら、お気軽にお問い合わせください。<br>
        当日お会いできることを心よりお待ちしております。</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            ALSOK株式会社 人事部<br>
            TEL: 03-1234-5678<br>
            Email: hr@alsok-demo.co.jp
          </p>
        </div>
      </div>
    </div>
    `;

    const text = `
${notification.applicantName} 様

ALSOK株式会社 2次面接のご案内

この度は採用選考にご応募いただき、ありがとうございました。
1次選考の結果、合格となりましたので、2次面接をご案内いたします。

■ 面接詳細
日時: ${notification.interviewDate} ${notification.interviewTime}
場所: ${notification.location}
面接官: ${notification.interviewer}

■ ご準備いただくもの
・履歴書（写真貼付）
・職務経歴書
・身分証明書
・筆記用具

ご参加の可否を3日以内にご返信ください。

お問い合わせ先:
ALSOK株式会社 人事部
TEL: 03-1234-5678
Email: hr@alsok-demo.co.jp
    `;

    return { html, text };
  }

  // 面接確認メールの内容構築
  private buildConfirmationEmail(notification: SecondaryInterviewNotification) {
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #059669; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">✅ 面接日程確定のお知らせ</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>${notification.applicantName} 様</p>
        <p>面接日程が下記の通り確定いたしました。</p>
        
        <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #0ea5e9;">
          <p><strong>日時:</strong> ${notification.interviewDate} ${notification.interviewTime}</p>
          <p><strong>場所:</strong> ${notification.location}</p>
          <p><strong>面接官:</strong> ${notification.interviewer}</p>
        </div>
        
        <p>当日はよろしくお願いいたします。</p>
      </div>
    </div>
    `;

    const text = `
面接日程確定のお知らせ

${notification.applicantName} 様
日時: ${notification.interviewDate} ${notification.interviewTime}
場所: ${notification.location}
面接官: ${notification.interviewer}

当日はよろしくお願いいたします。
    `;

    return { html, text };
  }

  // スケジュール予約数を更新
  private updateScheduleBooking(schedule: InterviewSchedule): void {
    const index = this.scheduleTemplates.findIndex(s => 
      s.date === schedule.date && 
      s.time === schedule.time && 
      s.location === schedule.location
    );
    
    if (index !== -1) {
      this.scheduleTemplates[index].currentBookings += 1;
    }
  }

  // 指定曜日の来週の日付を取得
  private getNextWeekday(dayOfWeek: number): string {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const targetDate = new Date(nextWeek);
    
    // 曜日を調整（0=日曜, 1=月曜, ...）
    const currentDay = targetDate.getDay();
    const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    
    return targetDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }
}

export const secondaryInterviewService = new SecondaryInterviewService();
export default secondaryInterviewService;