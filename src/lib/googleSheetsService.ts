// Googleスプレッドシート連携サービス（デモモード）
export interface ApplicantData {
  timestamp: string;
  name: string;
  email: string;
  phone: string;
  desiredPosition: string;
  experience: string;
  motivation: string;
  availableDate: string;
  status: 'pending' | 'approved' | 'rejected';
  interviewDate?: string;
  notes?: string;
}

// デモモード：実際のGoogle Sheets APIの代わりにローカルストレージを使用
class GoogleSheetsService {
  private sheetId = 'demo-alsok-interviews';
  
  // スプレッドシートに申請データを追加
  async addApplicant(data: ApplicantData): Promise<void> {
    try {
      // デモモードでは、実際のAPIコールをシミュレート
      const applicants = this.getStoredApplicants();
      const newApplicant = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      applicants.push(newApplicant);
      localStorage.setItem(`sheets-${this.sheetId}`, JSON.stringify(applicants));
      
      // APIコール感をシミュレート
      await this.simulateApiDelay();
      
      console.log('✅ スプレッドシートに追加:', newApplicant);
    } catch (error) {
      console.error('❌ スプレッドシート連携エラー:', error);
      throw error;
    }
  }

  // 申請者のステータス更新
  async updateApplicantStatus(
    applicantId: string, 
    status: 'pending' | 'approved' | 'rejected',
    notes?: string,
    interviewDate?: string
  ): Promise<void> {
    try {
      const applicants = this.getStoredApplicants();
      const applicantIndex = applicants.findIndex(a => a.id === applicantId);
      
      if (applicantIndex === -1) {
        throw new Error('申請者が見つかりません');
      }

      applicants[applicantIndex] = {
        ...applicants[applicantIndex],
        status,
        notes,
        interviewDate,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`sheets-${this.sheetId}`, JSON.stringify(applicants));
      await this.simulateApiDelay();
      
      console.log('✅ ステータス更新完了:', { applicantId, status, notes });
    } catch (error) {
      console.error('❌ ステータス更新エラー:', error);
      throw error;
    }
  }

  // 全申請者データを取得
  async getAllApplicants(): Promise<ApplicantData[]> {
    try {
      await this.simulateApiDelay();
      return this.getStoredApplicants();
    } catch (error) {
      console.error('❌ データ取得エラー:', error);
      return [];
    }
  }

  // スプレッドシートURL生成（デモ用）
  getSheetUrl(): string {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit#gid=0`;
  }

  // CSV形式でエクスポート
  async exportToCsv(): Promise<string> {
    const applicants = this.getStoredApplicants();
    const headers = [
      'ID', '申請日時', '氏名', 'メールアドレス', '電話番号', 
      '希望職種', '経験年数', '志望動機', '面接可能日', 'ステータス', 
      '面接日時', '備考'
    ];
    
    const csvContent = [
      headers.join(','),
      ...applicants.map(a => [
        a.id || '',
        a.timestamp,
        a.name,
        a.email,
        a.phone,
        a.desiredPosition,
        a.experience,
        `"${a.motivation.replace(/"/g, '""')}"`,
        a.availableDate,
        a.status,
        a.interviewDate || '',
        `"${(a.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  private getStoredApplicants(): any[] {
    const stored = localStorage.getItem(`sheets-${this.sheetId}`);
    return stored ? JSON.parse(stored) : [];
  }

  private async simulateApiDelay(): Promise<void> {
    // APIコールのリアル感を演出
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
  }

  // 実環境用のGoogle Sheets API接続（コメントアウト）
  /*
  private async getAuthenticatedClient() {
    // 実際の本番環境では以下のようなコードになります
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      keyFile: 'path/to/service-account-key.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
  }

  async addApplicantToRealSheet(data: ApplicantData) {
    const sheets = await this.getAuthenticatedClient();
    const request = {
      spreadsheetId: this.sheetId,
      range: 'A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          new Date().toISOString(),
          data.name,
          data.email,
          data.phone,
          data.desiredPosition,
          data.experience,
          data.motivation,
          data.availableDate,
          data.status,
          data.interviewDate || '',
          data.notes || ''
        ]]
      }
    };
    return sheets.spreadsheets.values.append(request);
  }
  */
}

export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;