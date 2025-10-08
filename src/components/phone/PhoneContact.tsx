import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  PhoneCall,
  MessageSquare, 
  CheckCircle,
  Shield,
  Clock,
  Smartphone,
  Volume2,
  VolumeX,
  User
} from 'lucide-react';
import { emailService } from '@/lib/emailService';
import { demoStorage } from '@/lib/demo-storage';

interface PhoneContactProps {
  onSmsComplete: (phoneNumber: string, applicantName: string) => void;
}

export function PhoneContact({ onSmsComplete }: PhoneContactProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [currentStep, setCurrentStep] = useState<'input' | 'calling' | 'voice' | 'sms_sent'>('input');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceStep, setVoiceStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const voiceMessages = [
    "お電話ありがとうございます。ALSOKの採用受付システムです。",
    "面接のご案内をSMSでお送りいたします。",
    "お名前を確認させていただきました。",
    "SMS送信を開始いたします。しばらくお待ちください。",
    "SMS送信が完了いたしました。ご確認ください。"
  ];

  useEffect(() => {
    if (currentStep === 'voice' && isPlaying) {
      const timer = setTimeout(() => {
        if (voiceStep < voiceMessages.length - 1) {
          setVoiceStep(voiceStep + 1);
        } else {
          // 音声完了後、SMS送信処理
          setCurrentStep('sms_sent');
          sendInterviewSms();
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [voiceStep, isPlaying, currentStep]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\d\-\+\(\)\s]{10,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleStartCall = () => {
    if (!phoneNumber.trim() || !applicantName.trim()) {
      alert('電話番号とお名前を入力してください');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      alert('有効な電話番号を入力してください');
      return;
    }

    setCurrentStep('calling');
    setTimeRemaining(3);
    
    // 3秒後に音声開始
    setTimeout(() => {
      setCurrentStep('voice');
      setIsPlaying(true);
      setVoiceStep(0);
    }, 3000);
  };

  const sendInterviewSms = async () => {
    try {
      const applicationId = `ALSOK-${Date.now()}`;
      const interviewUrl = `${window.location.origin}/mobile?interview=${applicationId}`;
      
      // 統一ストレージに電話受付情報を保存
      demoStorage.addPhoneContact(applicationId, phoneNumber, applicantName);
      
      const smsContent = `
【ALSOK採用】${applicantName}様

お電話ありがとうございました。
面接のご案内をお送りいたします。

📋 申請ID: ${applicationId}
🎯 1次面接URL: ${interviewUrl}

上記URLから面接を開始してください。
面接は約10分程度です。

※このSMSは自動送信されています
※ご質問は03-1234-5678まで
      `.trim();

      // SMS送信（EmailJS経由）
      await emailService.sendSmsNotification({
        to: 'demo@alsok-interview.com',
        smsContent,
        phoneNumber,
        timestamp: new Date().toLocaleString('ja-JP'),
        templateType: 'interview_invitation',
        applicantId: applicationId,
        demoUrl: window.location.origin
      });

      // SMS履歴に記録
      demoStorage.addSmsHistory({
        applicantId: applicationId,
        phoneNumber,
        content: smsContent,
        status: 'sent',
        type: 'interview_invitation'
      });

      // 完了通知
      onSmsComplete(phoneNumber, applicantName);
      
    } catch (error) {
      console.error('SMS送信エラー:', error);
    }
  };

  const toggleVoicePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-blue-900 text-white p-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold">ALSOK 採用受付</h1>
            <p className="text-blue-200 text-sm">電話による面接申込システム</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* 電話番号入力 */}
        {currentStep === 'input' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>面接申込み電話</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">📞 電話申込みの流れ</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. お名前と電話番号を入力</li>
                  <li>2. 自動音声ガイダンスを聞く</li>
                  <li>3. 面接案内SMSを受信</li>
                  <li>4. SMSのURLから面接開始</li>
                </ol>
              </div>

              <div>
                <Label htmlFor="name">お名前 *</Label>
                <Input
                  id="name"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <Label htmlFor="phone">電話番号 *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="090-1234-5678"
                />
              </div>

              <Button 
                onClick={handleStartCall}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!phoneNumber.trim() || !applicantName.trim()}
              >
                <PhoneCall className="h-4 w-4 mr-2" />
                電話をかける
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 呼び出し中 */}
        {currentStep === 'calling' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                  <PhoneCall className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">呼び出し中...</h3>
                  <p className="text-gray-600">ALSOKに接続しています</p>
                  {timeRemaining > 0 && (
                    <Badge variant="outline" className="mt-2">
                      {timeRemaining}秒
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 音声ガイダンス */}
        {currentStep === 'voice' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5" />
                  <span>音声ガイダンス</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVoicePlayback}
                >
                  {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm">{voiceMessages[voiceStep]}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">進行状況</span>
                  <Badge variant="outline">
                    {voiceStep + 1} / {voiceMessages.length}
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((voiceStep + 1) / voiceMessages.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center text-gray-600">
                <Clock className="h-4 w-4 inline mr-1" />
                <span className="text-sm">通話中... お待ちください</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SMS送信完了 */}
        {currentStep === 'sms_sent' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-800">SMS送信完了！</h3>
                  <p className="text-gray-600">面接案内をお送りしました</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg text-left">
                  <h4 className="font-medium text-green-800 mb-2">📱 送信内容</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>宛先:</strong> {phoneNumber}</p>
                    <p><strong>氏名:</strong> {applicantName}様</p>
                    <p><strong>内容:</strong> 面接URL + 手順案内</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>📧 管理者にも通知が送信されました</p>
                  <p>🕒 面接は約10分程度です</p>
                  <p>❓ ご質問は03-1234-5678まで</p>
                </div>

                <Button 
                  onClick={() => window.location.href = '/admin'}
                  variant="outline"
                  className="w-full"
                >
                  管理画面で確認
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}