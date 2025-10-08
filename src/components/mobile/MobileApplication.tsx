import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Shield,
  Users,
  Clock,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { demoStorage } from '@/lib/demo-storage';
import { googleSheetsService } from '@/lib/googleSheetsService';
import { emailService } from '@/lib/emailService';
import { InterviewChat } from './InterviewChat';

interface ApplicationForm {
  fullName: string;
  furigana: string;
  email: string;
  phoneNumber: string;
  age: string;
  address: string;
  desiredPosition: string;
  experience: string;
  motivation: string;
  availableStartDate: string;
  emergencyContact: string;
  emergencyPhone: string;
  hasLicense: boolean;
  licenseType: string;
  agreedToTerms: boolean;
}

const initialForm: ApplicationForm = {
  fullName: '',
  furigana: '',
  email: '',
  phoneNumber: '',
  age: '',
  address: '',
  desiredPosition: '',
  experience: '',
  motivation: '',
  availableStartDate: '',
  emergencyContact: '',
  emergencyPhone: '',
  hasLicense: false,
  licenseType: '',
  agreedToTerms: false
};

// SMS通知送信関数
const sendApplicationConfirmationSms = async (phoneNumber: string, applicantName: string, applicationId: string) => {
  try {
    const smsContent = `
【ALSOK採用】${applicantName}様

ご応募ありがとうございます。
申請ID: ${applicationId}

1次面接を開始してください。
下記URLにアクセスしてください：
${window.location.origin}/mobile?interview=${applicationId}

※このURLからチャット形式の面接を受けられます
    `.trim();

    // EmailJS経由でSMS通知をシミュレート
    await emailService.sendSmsNotification({
      to: 'demo@alsok-interview.com', // デモ用アドレス
      smsContent,
      phoneNumber,
      timestamp: new Date().toLocaleString('ja-JP'),
      templateType: 'app_received',
      applicantId: applicationId,
      demoUrl: window.location.origin
    });

    console.log('✅ SMS通知送信完了:', { phoneNumber, applicantName, applicationId });
  } catch (error) {
    console.error('❌ SMS送信エラー:', error);
  }
};

export function MobileApplication() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [showInterview, setShowInterview] = useState(false);
  
  // URLパラメータチェック（面接開始）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const interviewId = params.get('interview');
    if (interviewId) {
      // 面接モードで開始
      setApplicationId(interviewId);
      
      // 既存の申請者情報があるかチェック
      const existingApplicant = demoStorage.getApplicant(interviewId);
      if (existingApplicant?.phoneInfo) {
        // 電話で受け取った名前と電話番号を初期値に設定
        setForm(prev => ({
          ...prev,
          fullName: existingApplicant.phoneInfo?.name || '',
          phoneNumber: existingApplicant.phoneInfo?.phoneNumber || ''
        }));
      }
      
      setShowInterview(true);
    }
  }, []);
  
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateForm = (field: keyof ApplicationForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(form.fullName && form.furigana && form.email && form.phoneNumber && form.age);
      case 2:
        return !!(form.address && form.desiredPosition && form.availableStartDate);
      case 3:
        return !!(form.experience && form.motivation);
      case 4:
        return !!(form.emergencyContact && form.emergencyPhone && form.agreedToTerms);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitApplication = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      // 既存のIDがあればそれを使用、なければ新規生成
      const finalApplicationId = applicationId || `ALSOK-${Date.now()}`;
      
      // 統一ストレージに申込情報を保存
      demoStorage.completeApplication(finalApplicationId, form);
      
      // Googleスプレッドシートに反映
      await googleSheetsService.addApplicant({
        timestamp: new Date().toISOString(),
        name: form.fullName,
        email: form.email,
        phone: form.phoneNumber,
        desiredPosition: form.desiredPosition,
        experience: form.experience,
        motivation: form.motivation,
        availableDate: form.availableStartDate,
        status: 'pending'
      });

      // SMS通知送信（申込完了通知）
      await sendApplicationConfirmationSms(form.phoneNumber, form.fullName, finalApplicationId);

      setApplicationId(finalApplicationId);
      setIsCompleted(true);
      
      // 完了SMS履歴に追加
      demoStorage.addSmsHistory({
        applicantId: finalApplicationId,
        phoneNumber: form.phoneNumber,
        content: `【ALSOK】${form.fullName}様の申込を受付けました。ID: ${finalApplicationId}`,
        status: 'sent',
        type: 'app_received'
      });
      
    } catch (error) {
      console.error('申請送信エラー:', error);
      alert('申請の送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterviewComplete = () => {
    // 面接完了後は申込フォームに遷移
    setShowInterview(false);
    
    // 面接情報を反映
    if (applicationId) {
      const existingApplicant = demoStorage.getApplicant(applicationId);
      if (existingApplicant?.phoneInfo) {
        // 電話受付時の情報を申込フォームに引き継ぎ
        setForm(prev => ({
          ...prev,
          fullName: existingApplicant.phoneInfo?.name || prev.fullName,
          phoneNumber: existingApplicant.phoneInfo?.phoneNumber || prev.phoneNumber
        }));
      }
    }
  };

  // 面接画面表示
  if (showInterview) {
    return (
      <InterviewChat
        applicantId={applicationId}
        applicantName={form.fullName || "応募者"}
        onInterviewComplete={handleInterviewComplete}
      />
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900">申請完了！</h2>
                <p className="text-gray-600 mt-2">ご応募ありがとうございました</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900">申請ID</p>
                <p className="text-lg font-mono text-blue-800 mt-1">{applicationId}</p>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p>📧 確認メールを送信いたします</p>
                <p>📋 審査結果は3営業日以内にご連絡</p>
                <p>⚡ 管理者に自動で通知されました</p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowInterview(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  1次面接を開始する
                </Button>
                
                <Button 
                  onClick={() => {
                    setIsCompleted(false);
                    setCurrentStep(1);
                    setForm(initialForm);
                    setApplicationId('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  新しい申請を作成
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-blue-900 text-white p-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold">ALSOK 採用申請</h1>
            <p className="text-blue-200 text-sm">セキュリティのプロフェッショナル募集</p>
          </div>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="bg-white p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">ステップ {currentStep} / {totalSteps}</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStep === 1 && <><Users className="h-5 w-5" /><span>基本情報</span></>}
              {currentStep === 2 && <><MapPin className="h-5 w-5" /><span>勤務情報</span></>}
              {currentStep === 3 && <><Clock className="h-5 w-5" /><span>経験・志望動機</span></>}
              {currentStep === 4 && <><Phone className="h-5 w-5" /><span>緊急連絡先・同意事項</span></>}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ステップ1: 基本情報 */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">氏名 *</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => updateForm('fullName', e.target.value)}
                    placeholder="山田 太郎"
                  />
                </div>
                
                <div>
                  <Label htmlFor="furigana">フリガナ *</Label>
                  <Input
                    id="furigana"
                    value={form.furigana}
                    onChange={(e) => updateForm('furigana', e.target.value)}
                    placeholder="ヤマダ タロウ"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="example@email.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">電話番号 *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => updateForm('phoneNumber', e.target.value)}
                    placeholder="090-1234-5678"
                  />
                </div>
                
                <div>
                  <Label htmlFor="age">年齢 *</Label>
                  <Select value={form.age} onValueChange={(value) => updateForm('age', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="年齢を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 48 }, (_, i) => i + 18).map(age => (
                        <SelectItem key={age} value={age.toString()}>
                          {age}歳
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ステップ2: 勤務情報 */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">住所 *</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    placeholder="東京都渋谷区..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="position">希望職種 *</Label>
                  <Select value={form.desiredPosition} onValueChange={(value) => updateForm('desiredPosition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="職種を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security-guard">警備員</SelectItem>
                      <SelectItem value="facility-security">施設警備</SelectItem>
                      <SelectItem value="traffic-security">交通警備</SelectItem>
                      <SelectItem value="bodyguard">身辺警護</SelectItem>
                      <SelectItem value="security-admin">警備管理</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="startDate">勤務開始希望日 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.availableStartDate}
                    onChange={(e) => updateForm('availableStartDate', e.target.value)}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="license"
                      checked={form.hasLicense}
                      onCheckedChange={(checked) => updateForm('hasLicense', !!checked)}
                    />
                    <Label htmlFor="license">警備業関連資格を保有</Label>
                  </div>
                  
                  {form.hasLicense && (
                    <Input
                      value={form.licenseType}
                      onChange={(e) => updateForm('licenseType', e.target.value)}
                      placeholder="資格名を入力"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ステップ3: 経験・志望動機 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="experience">警備業務経験 *</Label>
                  <Select value={form.experience} onValueChange={(value) => updateForm('experience', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="経験年数を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="未経験">未経験</SelectItem>
                      <SelectItem value="1年未満">1年未満</SelectItem>
                      <SelectItem value="1-3年">1-3年</SelectItem>
                      <SelectItem value="3-5年">3-5年</SelectItem>
                      <SelectItem value="5年以上">5年以上</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="motivation">志望動機 *</Label>
                  <Textarea
                    id="motivation"
                    value={form.motivation}
                    onChange={(e) => updateForm('motivation', e.target.value)}
                    placeholder="ALSOKを志望する理由をお聞かせください..."
                    rows={6}
                  />
                </div>
              </div>
            )}

            {/* ステップ4: 緊急連絡先・同意事項 */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emergencyContact">緊急連絡先（氏名） *</Label>
                  <Input
                    id="emergencyContact"
                    value={form.emergencyContact}
                    onChange={(e) => updateForm('emergencyContact', e.target.value)}
                    placeholder="緊急時連絡先の氏名"
                  />
                </div>
                
                <div>
                  <Label htmlFor="emergencyPhone">緊急連絡先（電話番号） *</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) => updateForm('emergencyPhone', e.target.value)}
                    placeholder="090-1234-5678"
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">個人情報の取扱いについて</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    お預かりした個人情報は、採用選考の目的でのみ使用し、
                    適切に管理いたします。詳細は弊社プライバシーポリシーをご確認ください。
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={form.agreedToTerms}
                      onCheckedChange={(checked) => updateForm('agreedToTerms', !!checked)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      個人情報の取扱いに同意します *
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* ナビゲーションボタン */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>戻る</span>
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center space-x-2"
                >
                  <span>次へ</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={submitApplication}
                  disabled={!validateStep(4) || isSubmitting}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <span>{isSubmitting ? '送信中...' : '申請を送信'}</span>
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}