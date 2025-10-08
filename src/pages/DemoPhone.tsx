import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUnifiedStorage } from "@/lib/demo-storage";

const DemoPhone = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStep, setCallStep] = useState(0);

  const handleStartCall = () => {
    if (!phoneNumber || !name) {
      toast.error("電話番号と名前を入力してください");
      return;
    }

    setIsCallActive(true);
    setCallStep(1);

    // 自動応答シミュレーション
    setTimeout(() => setCallStep(2), 2000);
    setTimeout(() => setCallStep(3), 4000);
    setTimeout(() => {
      // デモストレージに応募者データを保存
      const storage = getUnifiedStorage();
      const applicantId = `APP${Date.now().toString().slice(-6)}`;
      
      storage.addApplicant({
        id: applicantId,
        name,
        phone: phoneNumber,
        status: "sms_sent",
        source: "phone",
        created_at: new Date().toISOString(),
        interview_responses: [],
        sms_history: [
          {
            id: Date.now().toString(),
            type: "confirmation",
            content: `${name}様、ALSOK採用担当です。面接のご案内をお送りします。こちらのリンクから面接を開始してください：`,
            sent_at: new Date().toISOString(),
            status: "sent"
          }
        ]
      });

      setCallStep(4);
      toast.success("SMS送信完了！QRコードが生成されました");
    }, 6000);
  };

  const callSteps = [
    "",
    "📞 呼び出し中...",
    "🤖 ALSOKです。採用面接のお申し込みありがとうございます",
    "📱 SMS送信中...",
    "✅ 完了！QRコードをPC管理画面でご確認ください"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          デモホームに戻る
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Phone className="h-6 w-6 text-green-600" />
              電話受付シミュレーション
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isCallActive ? (
              <>
                <div>
                  <Label htmlFor="name">お名前</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="山田太郎"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="090-1234-5678"
                  />
                </div>
                <Button
                  onClick={handleStartCall}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  ALSOK採用窓口に電話をかける
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">
                  {callStep === 4 ? "✅" : "📞"}
                </div>
                <p className="text-lg font-medium mb-4">
                  {callSteps[callStep]}
                </p>
                {callStep === 4 && (
                  <div className="space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    <p className="text-sm text-gray-600">
                      PC管理画面でQRコードを確認し、<br />
                      モバイルデバイスでスキャンして面接を開始してください
                    </p>
                    <Button
                      onClick={() => navigate("/admin")}
                      variant="outline"
                      className="w-full"
                    >
                      PC管理画面を見る
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoPhone;