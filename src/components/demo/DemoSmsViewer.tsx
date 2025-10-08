import { useState, useEffect } from "react";
import { X, Smartphone, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DemoSmsMessage {
  to: string;
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
}

export const DemoSmsViewer = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [messages, setMessages] = useState<DemoSmsMessage[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // カスタムイベントリスナーでSMS送信を監視
  useEffect(() => {
    const handleDemoSms = (event: CustomEvent) => {
      const newMessage: DemoSmsMessage = event.detail;
      setMessages(prev => [newMessage, ...prev].slice(0, 10)); // 最新10件まで保持
      
      // 自動で展開
      if (isCollapsed) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('demo-sms-sent', handleDemoSms as EventListener);
    return () => {
      window.removeEventListener('demo-sms-sent', handleDemoSms as EventListener);
    };
  }, [isCollapsed]);

  // デモモードが有効でない場合は表示しない
  const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
  if (!DEMO_MODE || !isVisible) return null;

  const getStatusIcon = (status: DemoSmsMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: DemoSmsMessage['status']) => {
    switch (status) {
      case 'sending': return '送信中';
      case 'sent': return '送信済み';
      case 'delivered': return '配信完了';
      case 'failed': return '送信失敗';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader 
          className="pb-2 bg-blue-600 text-white rounded-t-lg cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <CardTitle className="flex items-center gap-2 text-sm">
            <Smartphone className="w-5 h-5" />
            📱 SMS送信デモ画面
            <Badge variant="secondary" className="ml-auto bg-white text-blue-600">
              {messages.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 text-white hover:bg-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                SMS送信を待機中...
                <br />
                <span className="text-xs">応募や予約操作を行ってください</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {messages.map((message, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50 transition-colors">
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-gray-600">
                        TO: {message.to}
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(message.status)}
                        <span className="text-xs text-gray-500">
                          {getStatusText(message.status)}
                        </span>
                      </div>
                    </div>
                    
                    {/* メッセージ内容 */}
                    <div className="bg-blue-50 rounded-lg p-2 mb-2">
                      <div className="text-sm text-gray-800 leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                    
                    {/* タイムスタンプ */}
                    <div className="text-xs text-gray-400">
                      {message.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* 再表示ボタン */}
      {!isVisible && (
        <Button
          onClick={() => setIsVisible(true)}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          📱 SMS画面を表示
        </Button>
      )}
    </div>
  );
};