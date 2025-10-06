import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Send, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ja } from "@/i18n/ja";
import { api } from "@/lib/api";
import { getUserData } from "@/lib/validation";

interface Question {
  id: number;
  text: string;
  type: "choice" | "text";
  options?: string[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "警備業務の経験はありますか？",
    type: "choice",
    options: ["あり（3年以上）", "あり（3年未満）", "なし"],
  },
  {
    id: 2,
    text: "希望する勤務形態を選択してください",
    type: "choice",
    options: ["正社員", "契約社員", "アルバイト・パート"],
  },
  {
    id: 3,
    text: "夜間勤務は可能ですか？",
    type: "choice",
    options: ["可能", "条件によっては可能", "不可"],
  },
  {
    id: 4,
    text: "普通自動車免許をお持ちですか？",
    type: "choice",
    options: ["あり", "なし（取得予定あり）", "なし"],
  },
  {
    id: 5,
    text: "志望動機を簡潔にお聞かせください",
    type: "text",
  },
  {
    id: 6,
    text: "いつから勤務可能ですか？",
    type: "choice",
    options: ["即日", "1ヶ月以内", "2ヶ月以内", "要相談"],
  },
  {
    id: 7,
    text: "最後に、特記事項があればご記入ください",
    type: "text",
  },
];

const Chat = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [textInput, setTextInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const isLastQuestion = currentStep === questions.length - 1;
  const hasAnswer = answers[currentQuestion.id] || textInput.trim();

  const handleChoice = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleNext = () => {
    if (!hasAnswer) {
      toast.error(ja.chat.required);
      return;
    }

    // Save text input if applicable
    if (currentQuestion.type === "text" && textInput.trim()) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: textInput,
      }));
      setTextInput("");
    }

    if (isLastQuestion) {
      handleFinalSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setTextInput("");
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      const userData = getUserData();
      const reserveUrl = `${window.location.origin}/reserve`;

      await api.sendSms({
        to: userData?.phone || "+81 90 0000 0000",
        templateId: "reserve",
        variables: {
          NAME: userData?.name || "応募者様",
          URL: reserveUrl,
        },
      });

      toast.success(ja.chat.successTitle, {
        description: ja.chat.successMessage,
      });

      setTimeout(() => {
        navigate("/reserve");
      }, 2000);
    } catch (error) {
      console.error("SMS send error:", error);
      toast.error(ja.chat.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] gradient-hero">
        <div className="container px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-2xl">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
                {ja.chat.title}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                {ja.chat.subtitle}
              </p>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-primary">
                  {ja.chat.progress
                    .replace("{current}", (currentStep + 1).toString())
                    .replace("{total}", questions.length.toString())}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <Card className="p-6 shadow-lg sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.type === "choice" ? (
                  currentQuestion.options?.map((option) => (
                    <Button
                      key={option}
                      variant={
                        answers[currentQuestion.id] === option
                          ? "default"
                          : "outline"
                      }
                      size="lg"
                      className="w-full justify-start text-left"
                      onClick={() => handleChoice(option)}
                    >
                      {option}
                    </Button>
                  ))
                ) : (
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder={ja.chat.textPlaceholder}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="min-h-[100px] text-base"
                      aria-label={currentQuestion.text}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Navigation */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                disabled={currentStep === 0 || isSubmitting}
                className="flex-1"
              >
                <ChevronLeft />
                {ja.chat.backButton}
              </Button>

              <Button
                variant="default"
                size="lg"
                onClick={handleNext}
                disabled={!hasAnswer || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {ja.common.loading}
                  </>
                ) : isLastQuestion ? (
                  <>
                    <Send />
                    {ja.chat.finalButton}
                  </>
                ) : (
                  <>
                    {ja.chat.nextButton}
                    <ChevronRight />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
