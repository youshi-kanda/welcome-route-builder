import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  QrCode,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUnifiedStorage, type UnifiedApplicant } from "@/lib/demo-storage";
import QRCode from "qrcode-generator";

const DemoAdmin = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<UnifiedApplicant[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const generateQRCode = () => {
    const baseUrl = window.location.origin;
    const mobileUrl = `${baseUrl}/mobile`;
    
    const qr = QRCode(0, 'M');
    qr.addData(mobileUrl);
    qr.make();
    
    // Generate SVG
    const svg = qr.createSvgTag({
      cellSize: 4,
      margin: 0,
      scalable: true
    });
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    setQrCodeUrl(url);
  };

  const loadApplicants = () => {
    const storage = getUnifiedStorage();
    const allApplicants = storage.getAllApplicants();
    setApplicants(allApplicants);
  };

  useEffect(() => {
    generateQRCode();
    loadApplicants();
    
    // リアルタイム更新のためのイベントリスナー
    const handleStorageUpdate = () => {
      loadApplicants();
    };

    window.addEventListener('demoStorageUpdate', handleStorageUpdate);
    
    // 定期的な更新
    const interval = setInterval(loadApplicants, 2000);
    
    return () => {
      window.removeEventListener('demoStorageUpdate', handleStorageUpdate);
      clearInterval(interval);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sms_sent':
        return <Badge className="bg-blue-500">SMS送信済み</Badge>;
      case 'interview_completed':
        return <Badge className="bg-green-500">面接完了</Badge>;
      case 'accepted':
        return <Badge className="bg-emerald-500">合格</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">不合格</Badge>;
      default:
        return <Badge variant="outline">新規</Badge>;
    }
  };

  const getStats = () => {
    const total = applicants.length;
    const smsCount = applicants.filter(a => a.sms_history.length > 0).length;
    const interviewCount = applicants.filter(a => a.interview_responses.length > 0).length;
    const completedCount = applicants.filter(a => a.status === 'interview_completed').length;
    
    return { total, smsCount, interviewCount, completedCount };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            デモホームに戻る
          </Button>
          
          <Button
            onClick={loadApplicants}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 統計情報 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-600">総応募者数</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">{stats.smsCount}</p>
                  <p className="text-sm text-gray-600">SMS送信</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold">{stats.interviewCount}</p>
                  <p className="text-sm text-gray-600">面接開始</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                  <p className="text-2xl font-bold">{stats.completedCount}</p>
                  <p className="text-sm text-gray-600">面接完了</p>
                </CardContent>
              </Card>
            </div>

            {/* 応募者一覧 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  応募者一覧 ({applicants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applicants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>まだ応募者がいません</p>
                    <p className="text-sm">電話受付またはQRコードからデモを開始してください</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applicants.map((applicant) => (
                      <Card key={applicant.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{applicant.name}</h3>
                            <p className="text-sm text-gray-600">{applicant.phone}</p>
                            <p className="text-xs text-gray-500">
                              ID: {applicant.id} | 
                              受付: {new Date(applicant.created_at).toLocaleString('ja-JP')}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(applicant.status)}
                            <div className="mt-2 text-xs text-gray-500">
                              <div>SMS: {applicant.sms_history.length}件</div>
                              <div>面接: {applicant.interview_responses.length}問回答</div>
                            </div>
                          </div>
                        </div>
                        
                        {applicant.interview_responses.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium mb-2">面接回答:</p>
                            <div className="text-xs text-gray-600 space-y-1">
                              {applicant.interview_responses.slice(0, 2).map((response, idx) => (
                                <div key={idx}>
                                  <span className="font-medium">Q{idx + 1}:</span> {response.answer.slice(0, 50)}...
                                </div>
                              ))}
                              {applicant.interview_responses.length > 2 && (
                                <div className="text-gray-500">他 {applicant.interview_responses.length - 2} 問...</div>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* QRコードとアクションパネル */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  面接QRコード
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {qrCodeUrl && (
                  <div className="mb-4">
                    <img 
                      src={qrCodeUrl} 
                      alt="面接用QRコード" 
                      className="w-48 h-48 mx-auto border rounded-lg"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-600 mb-4">
                  スマートフォンでスキャンして面接を開始
                </p>
                <Button
                  onClick={generateQRCode}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  QRコード再生成
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>デモアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => navigate("/phone")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  電話受付シミュレーション
                </Button>
                
                <Button
                  onClick={() => navigate("/mobile")}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  モバイル面接体験
                </Button>
                
                <Button
                  onClick={() => {
                    const storage = getUnifiedStorage();
                    storage.clearAll();
                    loadApplicants();
                  }}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  デモデータクリア
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoAdmin;