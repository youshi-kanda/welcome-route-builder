import { useState, useEffect } from "react";
import { Users, MessageCircle, Calendar, Eye, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DemoStorage from "@/lib/demo-storage";
import type { DemoApplicant } from "@/lib/demo-storage";

interface RealtimeStats {
  totalApplicants: number;
  pendingReview: number;
  interviewsCompleted: number;
  messagesExchanged: number;
}

export const RealtimeAdminDashboard = () => {
  const [applicants, setApplicants] = useState<DemoApplicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<DemoApplicant | null>(null);
  const [stats, setStats] = useState<RealtimeStats>({
    totalApplicants: 0,
    pendingReview: 0,
    interviewsCompleted: 0,
    messagesExchanged: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
  
  if (!DEMO_MODE) return null;

  useEffect(() => {
    // 初期データ読み込み
    loadDashboardData();

    // リアルタイム更新イベントリスナー
    const handleDataUpdate = (event: CustomEvent) => {
      loadDashboardData();
      
      if (event.detail.type === 'applicant') {
        toast.success("🆕 新着応募", {
          description: `${event.detail.data.name}様の応募を受信しました`
        });
      }
    };

    const handleMessageAdded = (event: CustomEvent) => {
      loadDashboardData();
    };

    const unsubscribe = DemoStorage.subscribeToUpdates(handleDataUpdate);
    window.addEventListener('demo-message-added', handleMessageAdded as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('demo-message-added', handleMessageAdded as EventListener);
    };
  }, []);

  const loadDashboardData = () => {
    const allApplicants = DemoStorage.getApplicants();
    const allMessages = DemoStorage.getMessages();
    
    setApplicants(allApplicants);
    
    // 統計情報計算
    const newStats = {
      totalApplicants: allApplicants.length,
      pendingReview: allApplicants.filter(a => a.status === 'interviewed' || a.status === 'pending').length,
      interviewsCompleted: allApplicants.filter(a => a.chat_responses && a.chat_responses.length > 0).length,
      messagesExchanged: allMessages.length
    };
    
    setStats(newStats);
  };

  const handleDecision = async (applicantId: string, decision: 'pass' | 'fail') => {
    const applicant = applicants.find(a => a.applicant_id === applicantId);
    if (!applicant) return;

    // ステータス更新
    const updatedApplicant: DemoApplicant = {
      ...applicant,
      status: decision,
      decision_memo: decision === 'pass' ? '2次面接に進行' : '今回は見送り'
    };

    DemoStorage.saveApplicant(updatedApplicant);

    // 合格の場合、2次面接通知SMS送信
    if (decision === 'pass') {
      // 模擬SMS送信
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const smsContent = `【二次面接のご案内】${applicant.name}様、${tomorrow.toLocaleDateString('ja-JP')} 14:00–15:00 で予定いたします。よろしければ「1」と返信、変更は「2」と返信ください。`;

      // SMS送信イベント発火
      window.dispatchEvent(new CustomEvent('demo-sms-sent', {
        detail: {
          to: applicant.phone,
          content: smsContent,
          timestamp: new Date().toLocaleString('ja-JP'),
          status: 'delivered'
        }
      }));

      toast.success("✅ 合格通知送信完了", {
        description: `${applicant.name}様に2次面接案内を送信しました`
      });
    } else {
      toast.success("📝 判定完了", {
        description: `${applicant.name}様の審査を完了しました`
      });
    }

    setSelectedApplicant(null);
  };

  const getStatusColor = (status: DemoApplicant['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'interviewed': return 'bg-blue-100 text-blue-800';
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: DemoApplicant['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'interviewed': return <MessageCircle className="w-4 h-4" />;
      case 'pass': return <CheckCircle className="w-4 h-4" />;
      case 'fail': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: DemoApplicant['status']) => {
    switch (status) {
      case 'pending': return '応募受付';
      case 'interviewed': return '面接完了';
      case 'pass': return '合格';
      case 'fail': return '不合格';
      default: return '不明';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-4 z-30">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
        >
          👔 管理画面を表示
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <h2 className="text-xl font-bold">👔 リアルタイム管理ダッシュボード</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-white hover:bg-purple-700"
          >
            ✕ 閉じる
          </Button>
        </div>

        <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
          {/* 統計カード */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalApplicants}</div>
                <div className="text-sm text-gray-600">総応募数</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.pendingReview}</div>
                <div className="text-sm text-gray-600">審査待ち</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.interviewsCompleted}</div>
                <div className="text-sm text-gray-600">面接完了</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.messagesExchanged}</div>
                <div className="text-sm text-gray-600">メッセージ</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 応募者一覧 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  応募者一覧
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                {applicants.map((applicant) => (
                  <div 
                    key={applicant.applicant_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedApplicant(applicant)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{applicant.name}</div>
                      <div className="text-sm text-gray-500">{applicant.phone}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(applicant.created_at).toLocaleString('ja-JP')}
                      </div>
                    </div>
                    <Badge className={getStatusColor(applicant.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(applicant.status)}
                        {getStatusText(applicant.status)}
                      </div>
                    </Badge>
                  </div>
                ))}
                {applicants.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    応募者がいません
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 面接結果詳細 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  面接結果詳細
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedApplicant ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">{selectedApplicant.name}様</h4>
                      <p className="text-sm text-gray-600">{selectedApplicant.phone}</p>
                      <Badge className={getStatusColor(selectedApplicant.status)}>
                        {getStatusText(selectedApplicant.status)}
                      </Badge>
                    </div>

                    {selectedApplicant.chat_responses && selectedApplicant.chat_responses.length > 0 ? (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">💬 面接回答</h5>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedApplicant.chat_responses.map((response, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded">
                              <div className="text-xs font-medium text-gray-700">
                                Q{index + 1}: {response.question}
                              </div>
                              <div className="text-sm mt-1">
                                A: {response.answer}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        面接回答がありません
                      </div>
                    )}

                    {(selectedApplicant.status === 'interviewed' || selectedApplicant.status === 'pending') && (
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => handleDecision(selectedApplicant.applicant_id, 'pass')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          ✅ 合格 - 2次面接へ
                        </Button>
                        <Button
                          onClick={() => handleDecision(selectedApplicant.applicant_id, 'fail')}
                          variant="destructive"
                          className="flex-1"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          ❌ 不合格
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    応募者を選択してください
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};