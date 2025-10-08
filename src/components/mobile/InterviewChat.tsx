import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle,
  User,
  Bot,
  Shield
} from 'lucide-react';
import { demoStorage } from '@/lib/demo-storage';

interface ChatMessage {
  id: string;
  sender: 'interviewer' | 'applicant';
  content: string;
  timestamp: Date;
  type?: 'question' | 'answer' | 'system';
}

interface InterviewChatProps {
  applicantId: string;
  applicantName: string;
  onInterviewComplete: () => void;
}

const INTERVIEW_QUESTIONS = [
  "はじめまして！本日はお忙しい中、面接のお時間をいただきありがとうございます。まず、簡単に自己紹介をお願いします。",
  "警備業界に興味を持ったきっかけを教えてください。",
  "これまでの職歴で、責任感を持って取り組んだ経験があれば教えてください。",
  "夜勤や交代勤務についてはいかがですか？対応可能でしょうか？",
  "最後に、ALSOKで働くことへの意気込みを聞かせてください。"
];

export function InterviewChat({ applicantId, applicantName, onInterviewComplete }: InterviewChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 面接開始をストレージに記録
    demoStorage.startInterview(applicantId);
    
    // 面接開始メッセージ
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      sender: 'interviewer',
      content: `${applicantName}さん、ALSOKの1次面接を開始いたします。チャット形式で進めさせていただきますので、リラックスしてお答えください。`,
      timestamp: new Date(),
      type: 'system'
    };

    setMessages([welcomeMessage]);
    
    // 最初の質問を少し遅れて表示
    setTimeout(() => {
      askNextQuestion();
    }, 2000);
  }, [applicantName, applicantId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const progress = (currentQuestionIndex / INTERVIEW_QUESTIONS.length) * 100;
    setInterviewProgress(progress);
  }, [currentQuestionIndex]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const askNextQuestion = () => {
    if (currentQuestionIndex < INTERVIEW_QUESTIONS.length) {
      const questionMessage: ChatMessage = {
        id: `question_${currentQuestionIndex}`,
        sender: 'interviewer',
        content: INTERVIEW_QUESTIONS[currentQuestionIndex],
        timestamp: new Date(),
        type: 'question'
      };

      setMessages(prev => [...prev, questionMessage]);
      setIsWaitingForAnswer(true);
    } else {
      completeInterview();
    }
  };

  const handleSendAnswer = () => {
    if (!currentInput.trim() || !isWaitingForAnswer) return;

    const answer = currentInput.trim();
    const question = INTERVIEW_QUESTIONS[currentQuestionIndex];

    // 回答を追加
    const answerMessage: ChatMessage = {
      id: `answer_${currentQuestionIndex}`,
      sender: 'applicant',
      content: answer,
      timestamp: new Date(),
      type: 'answer'
    };

    setMessages(prev => [...prev, answerMessage]);
    
    // ストレージに回答を記録
    demoStorage.addInterviewResponse(applicantId, question, answer);
    
    setCurrentInput('');
    setIsWaitingForAnswer(false);

    // 次の質問に進む
    setCurrentQuestionIndex(prev => prev + 1);
    
    // 少し間を空けて次の質問
    setTimeout(() => {
      askNextQuestion();
    }, 1500);
  };

  const completeInterview = () => {
    // ストレージに面接完了を記録
    demoStorage.completeInterview(applicantId);
    
    const completionMessage: ChatMessage = {
      id: 'completion',
      sender: 'interviewer',
      content: 'ありがとうございました！1次面接はこれで終了です。お疲れ様でした。続いて申込フォームにお進みください。',
      timestamp: new Date(),
      type: 'system'
    };

    setMessages(prev => [...prev, completionMessage]);
    setIsCompleted(true);
    setInterviewProgress(100);

    // 面接完了を親コンポーネントに通知
    setTimeout(() => {
      onInterviewComplete();
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAnswer();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-blue-900 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-bold">ALSOK 1次面接</h1>
              <p className="text-blue-200 text-sm">{applicantName}様</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white text-blue-900">
            進行率 {Math.round(interviewProgress)}%
          </Badge>
        </div>
      </div>

      {/* プログレスバー */}
      <div className="bg-white border-b p-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${interviewProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>質問 {Math.min(currentQuestionIndex + 1, INTERVIEW_QUESTIONS.length)} / {INTERVIEW_QUESTIONS.length}</span>
          <span>残り約 {Math.max(0, (INTERVIEW_QUESTIONS.length - currentQuestionIndex) * 2)} 分</span>
        </div>
      </div>

      {/* チャット画面 */}
      <div className="flex-1 p-4">
        <Card className="h-96 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <MessageSquare className="h-4 w-4" />
              <span>面接チャット</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {/* メッセージエリア */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-72">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'applicant' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'applicant'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'system'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === 'interviewer' && (
                        <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                      )}
                      {message.sender === 'applicant' && (
                        <User className="h-4 w-4 mt-1 flex-shrink-0 text-white" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'applicant' ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString('ja-JP', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 入力エリア */}
            {!isCompleted && (
              <div className="border-t pt-4">
                {isWaitingForAnswer ? (
                  <div className="flex space-x-2">
                    <Input
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="回答を入力してください..."
                      className="flex-1"
                      disabled={!isWaitingForAnswer}
                    />
                    <Button
                      onClick={handleSendAnswer}
                      disabled={!currentInput.trim()}
                      size="sm"
                      className="px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <Clock className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-sm">面接官が次の質問を準備しています...</p>
                  </div>
                )}
              </div>
            )}

            {/* 完了メッセージ */}
            {isCompleted && (
              <div className="text-center py-4 border-t">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="font-medium text-green-800">面接完了！</p>
                <p className="text-sm text-gray-600">お疲れ様でした</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}