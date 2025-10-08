import { useState, useEffect } from "react";
import { Mail, Settings, Send, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import EmailService, { type EmailSetup } from "@/lib/emailService";

export const EmailSetupPanel = () => {
  const [emailSetup, setEmailSetup] = useState<EmailSetup>({
    isEnabled: false,
    recipientEmail: '',
    senderName: 'ALSOK面接システム'
  });
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [emailsSent, setEmailsSent] = useState(0);

  const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
  
  if (!DEMO_MODE) return null;

  useEffect(() => {
    // 初期化とメール設定読み込み
    const emailService = EmailService.getInstance();
    emailService.initialize();
    const setup = emailService.getEmailSetup();
    setEmailSetup(setup);

    // メール送信イベントリスナー
    const handleEmailSent = (event: CustomEvent) => {
      setEmailsSent(prev => prev + 1);
      toast.success("📧 メール送信完了", {
        description: `${event.detail.to} に送信されました`
      });
    };

    // 設定変更イベントリスナー
    const handleSetupChanged = (event: CustomEvent) => {
      setEmailSetup(event.detail);
    };

    window.addEventListener('demo-email-sent', handleEmailSent as EventListener);
    window.addEventListener('demo-email-setup-changed', handleSetupChanged as EventListener);

    return () => {
      window.removeEventListener('demo-email-sent', handleEmailSent as EventListener);
      window.removeEventListener('demo-email-setup-changed', handleSetupChanged as EventListener);
    };
  }, []);

  const updateEmailSetup = (updates: Partial<EmailSetup>) => {
    const newSetup = { ...emailSetup, ...updates };
    setEmailSetup(newSetup);
    
    const emailService = EmailService.getInstance();
    emailService.updateEmailSetup(newSetup);
  };

  const sendTestEmail = async () => {
    if (!emailSetup.recipientEmail) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    setIsSendingTest(true);
    try {
      const emailService = EmailService.getInstance();
      const success = await emailService.sendTestEmail();
      
      if (success) {
        toast.success("📧 テストメール送信完了", {
          description: "SMS通知の動作を確認できます"
        });
      } else {
        toast.error("テストメール送信に失敗しました");
      }
    } catch (error) {
      toast.error("メール送信エラーが発生しました");
    } finally {
      setIsSendingTest(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="fixed top-4 left-4 z-40 max-w-sm">
      <Card className="shadow-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader 
          className="pb-3 bg-orange-600 text-white rounded-t-lg cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <CardTitle className="flex items-center gap-2 text-sm">
            <Mail className="w-5 h-5" />
            📧 メール通知設定
            <div className="ml-auto flex items-center gap-1">
              {emailSetup.isEnabled ? (
                <>
                  <Check className="w-4 h-4" />
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    ON ({emailsSent})
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    OFF
                  </Badge>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="p-4 space-y-4">
            {/* 有効/無効スイッチ */}
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled" className="text-sm font-medium">
                📧 メール通知
              </Label>
              <Switch
                id="email-enabled"
                checked={emailSetup.isEnabled}
                onCheckedChange={(enabled) => updateEmailSetup({ isEnabled: enabled })}
              />
            </div>

            {/* メールアドレス入力 */}
            <div className="space-y-2">
              <Label htmlFor="recipient-email" className="text-sm font-medium">
                📮 受信メールアドレス
              </Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="your-email@example.com"
                value={emailSetup.recipientEmail}
                onChange={(e) => updateEmailSetup({ recipientEmail: e.target.value })}
                className={`text-sm ${
                  emailSetup.recipientEmail && !isValidEmail(emailSetup.recipientEmail) 
                    ? 'border-red-300 focus:border-red-500' 
                    : ''
                }`}
              />
              {emailSetup.recipientEmail && !isValidEmail(emailSetup.recipientEmail) && (
                <p className="text-xs text-red-600">
                  有効なメールアドレスを入力してください
                </p>
              )}
            </div>

            {/* 送信者名 */}
            <div className="space-y-2">
              <Label htmlFor="sender-name" className="text-sm font-medium">
                👤 送信者名
              </Label>
              <Input
                id="sender-name"
                type="text"
                placeholder="ALSOK面接システム"
                value={emailSetup.senderName || ''}
                onChange={(e) => updateEmailSetup({ senderName: e.target.value })}
                className="text-sm"
              />
            </div>

            {/* テスト送信ボタン */}
            <div className="pt-2">
              <Button
                onClick={sendTestEmail}
                disabled={!emailSetup.recipientEmail || !isValidEmail(emailSetup.recipientEmail) || isSendingTest}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                {isSendingTest ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    テスト送信中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    テスト送信
                  </>
                )}
              </Button>
            </div>

            {/* 統計情報 */}
            {emailSetup.isEnabled && (
              <div className="pt-2 border-t border-orange-100">
                <div className="text-xs text-orange-700 space-y-1">
                  <div className="flex justify-between">
                    <span>📊 送信済み:</span>
                    <span className="font-medium">{emailsSent}件</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📮 受信先:</span>
                    <span className="font-mono text-xs truncate max-w-[120px]">
                      {emailSetup.recipientEmail}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 使い方説明 */}
            <details className="pt-2 border-t border-orange-100">
              <summary className="text-xs cursor-pointer text-orange-600 hover:text-orange-800">
                📋 使い方
              </summary>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>• SMS送信時に同じ内容がメール配信</p>
                <p>• 応募・面接・通知のリアルタイム確認</p>
                <p>• クライアントデモ時の受信体験</p>
              </div>
            </details>
          </CardContent>
        )}
      </Card>
    </div>
  );
};