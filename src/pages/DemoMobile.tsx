import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Smartphone, Send, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUnifiedStorage } from "@/lib/demo-storage";

const DemoMobile = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [applicantId, setApplicantId] = useState("");

  const questions = [
    "自己紹介をお願いします（お名前、年齢、職歴など）",
    "警備業に興味を持ったきっかけを教えてください",
    "夜勤や不規則な勤務時間に対応できますか？",
    "チームワークを重視する場面での経験はありますか？",
    "最後に、ALSOKで働く意気込みを聞かせてください"
  ];

  useEffect(() => {
    // URLパラメータから応募者IDを取得（実際のQRコード経由をシミュレート）
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id") || `APP${Date.now().toString().slice(-6)}`;
    setApplicantId(id);
  }, []);

  const handleNextQuestion = () => {
    if (!currentResponse.trim()) {
      toast.error("回答を入力してください");
      return;
    }

    const newResponses = [...responses, currentResponse];
    setResponses(newResponses);
    setCurrentResponse("");

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 面接完了
      handleCompleteInterview(newResponses);
    }
  };

  const handleCompleteInterview = (finalResponses: string[]) => {
    const storage = getUnifiedStorage();
    
    // 面接データを更新
    const interviewResponses = questions.map((question, index) => ({
      question,
      answer: finalResponses[index] || "",
      timestamp: new Date().toISOString()
    }));

    // 応募者情報を更新
    let applicant = storage.getApplicant(applicantId);
    if (applicant) {
      applicant.interview_responses = interviewResponses;
      applicant.status = "interview_completed";
      applicant.interview_completed_at = new Date().toISOString();
      storage.updateApplicant(applicant);
    } else {
      // 新規応募者として追加
      storage.addApplicant({
        id: applicantId,
        name: "デモ応募者",
        phone: "090-1234-5678",
        status: "interview_completed",
        source: "mobile",
        created_at: new Date().toISOString(),
        interview_completed_at: new Date().toISOString(),
        interview_responses: interviewResponses,
        sms_history: []
      });
    }

    setIsCompleted(true);
    toast.success("面接が完了しました！");
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">面接完了！</h2>
            <p className="text-gray-600 mb-4">
              ありがとうございました。<br />
              結果は後日ご連絡いたします。
            </p>
            <p className="text-sm text-gray-500 mb-6">
              応募者ID: {applicantId}
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full"
            >
              デモホームに戻る
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-4">
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
              <Smartphone className="h-6 w-6 text-orange-600" />
              AI面接システム
            </CardTitle>
            <p className="text-sm text-gray-600">
              質問 {currentQuestion + 1} / {questions.length}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`
                }}
              />
            </div>

            <div>
              <Label className="text-base font-medium">質問</Label>
              <p className="mt-2 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                {questions[currentQuestion]}
              </p>
            </div>

            <div>
              <Label htmlFor="response">回答</Label>
              <Textarea
                id="response"
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="こちらに回答を入力してください..."
                className="min-h-[120px] mt-2"
              />
            </div>

            <Button
              onClick={handleNextQuestion}
              className="w-full bg-orange-600 hover:bg-orange-700"
              size="lg"
            >
              <Send className="h-5 w-5 mr-2" />
              {currentQuestion < questions.length - 1 ? "次の質問へ" : "面接を完了"}
            </Button>

            {responses.length > 0 && (
              <div className="mt-6">
                <Label className="text-sm font-medium text-gray-700">
                  回答済み: {responses.length}問
                </Label>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoMobile;