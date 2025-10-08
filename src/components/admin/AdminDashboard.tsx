import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  ExternalLink,
  Calendar,
  Mail,
  FileSpreadsheet,
  QrCode,
  MessageSquare,
  Smartphone,
  Copy
} from 'lucide-react';
import { googleSheetsService, ApplicantData } from '@/lib/googleSheetsService';
import { secondaryInterviewService } from '@/lib/secondaryInterviewService';
import { demoStorage, UnifiedApplicant, SmsHistory } from '@/lib/demo-storage';
import qrGenerator from 'qrcode-generator';

export function AdminDashboard() {
  const [applicants, setApplicants] = useState<UnifiedApplicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<UnifiedApplicant | null>(null);
  const [smsHistory, setSmsHistory] = useState<SmsHistory[]>([]);
  const [notes, setNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCodeSvg, setQrCodeSvg] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    phoneReceived: 0,
    interviewStarted: 0,
    applicationCompleted: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    smsToday: 0,
    smsTotal: 0
  });

  // QRコード生成
  const generateQRCode = () => {
    const phoneUrl = `${window.location.origin}/phone`;
    const qr = qrGenerator(0, 'M');
    qr.addData(phoneUrl);
    qr.make();
    setQrCodeSvg(qr.createSvgTag(4));
  };

  useEffect(() => {
    loadApplicants();
    generateQRCode();
    
    // リアルタイム更新のリスナー設定
    const handleDataUpdate = () => {
      loadApplicants();
    };
    
    const handleSmsUpdate = () => {
      setSmsHistory(demoStorage.getSmsHistory());
    };
    
    const handleStatsUpdate = (event: any) => {
      setStats(event.detail);
    };
    
    window.addEventListener('demo-data-updated', handleDataUpdate);
    window.addEventListener('demo-sms-sent', handleSmsUpdate);
    window.addEventListener('demo-stats-updated', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('demo-data-updated', handleDataUpdate);
      window.removeEventListener('demo-sms-sent', handleSmsUpdate);
      window.removeEventListener('demo-stats-updated', handleStatsUpdate);
    };
  }, []);

  const loadApplicants = async () => {
    try {
      // 統一ストレージから申請者データを取得
      const unifiedApplicants = demoStorage.getApplicants();
      setApplicants(unifiedApplicants);
      
      // SMS履歴を取得
      const smsData = demoStorage.getSmsHistory();
      setSmsHistory(smsData);
      
      // 統計情報を取得
      const statsData = demoStorage.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('申請者データ読み込みエラー:', error);
    }
  };

  const handleStatusUpdate = async (applicantId: string, newStatus: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      // 統一ストレージのステータス更新
      demoStorage.updateReviewStatus(applicantId, newStatus, notes, interviewDate);
      
      // Googleスプレッドシートに反映
      await googleSheetsService.updateApplicantStatus(applicantId, newStatus, notes, interviewDate);
      
      // 2次審査案内メール送信（合格の場合）
      if (newStatus === 'approved') {
        const applicant = applicants.find(a => a.id === applicantId);
        if (applicant?.personalInfo) {
          const emailSent = await secondaryInterviewService.sendSecondaryInterviewInvitation(
            applicant.personalInfo.fullName,
            applicant.personalInfo.email
          );
          
          if (emailSent) {
            // 2次面接案内SMS履歴に追加
            demoStorage.addSmsHistory({
              applicantId,
              phoneNumber: applicant.personalInfo.phoneNumber,
              content: `【ALSOK】${applicant.personalInfo.fullName}様、2次面接のご案内をメールでお送りしました。`,
              status: 'sent',
              type: 'final_interview_invitation'
            });
            
            alert(`${applicant.personalInfo.fullName}様に2次面接のご案内を送信しました！`);
          }
        }
      }
      
      // データを再読み込み
      await loadApplicants();
      setSelectedApplicant(null);
      setNotes('');
      setInterviewDate('');
      
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const exportToSpreadsheet = async () => {
    try {
      const csvContent = await googleSheetsService.exportToCsv();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `alsok-applicants-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('エクスポートエラー:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'phone_received': return 'bg-blue-100 text-blue-800';
      case 'interview_started': return 'bg-purple-100 text-purple-800';
      case 'application_completed': return 'bg-orange-100 text-orange-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'phone_received': return '電話受付済';
      case 'interview_started': return '面接中';
      case 'application_completed': return '申込完了';
      case 'pending_review': return '審査中';
      case 'approved': return '合格';
      case 'rejected': return '不合格';
      default: return '未設定';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ALSOK 採用管理システム</h1>
            <p className="text-gray-600 mt-2">面接官専用ダッシュボード</p>
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={exportToSpreadsheet} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              CSVエクスポート
            </Button>
            <Button onClick={() => window.open(googleSheetsService.getSheetUrl(), '_blank')} variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              スプレッドシート
            </Button>
          </div>
        </div>

        {/* QRコード & SMS監視パネル */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>応募用QRコード</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  {qrCodeSvg ? (
                    <div 
                      className="w-44 h-44"
                      dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                    />
                  ) : (
                    <div className="text-center">
                      <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">QRコード生成中...</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="font-medium">電話受付URL</p>
                  <p className="text-sm text-blue-600 break-all">
                    {window.location.origin}/phone
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/phone`)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    URLコピー
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>SMS送信状況</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {smsHistory.length > 0 ? (
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {smsHistory.slice(0, 3).map((sms) => (
                      <div key={sms.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{sms.phoneNumber}</p>
                            <p className="text-xs text-gray-600 truncate max-w-40">
                              {sms.content.substring(0, 50)}...
                            </p>
                          </div>
                          <Badge variant={sms.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                            {sms.status === 'sent' ? '送信済' : '失敗'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(sms.sentAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Smartphone className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">SMS送信履歴</p>
                    <p className="text-xs text-gray-400">申込完了時に表示</p>
                  </div>
                )}
                
                <div className="text-sm space-y-2 border-t pt-3">
                  <div className="flex justify-between">
                    <span>今日の送信数:</span>
                    <Badge variant="outline">{stats.smsToday}件</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>総送信数:</span>
                    <Badge variant="outline">{stats.smsTotal}件</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総申請数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">全ステップ含む</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">面接中</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.interviewStarted}</div>
              <p className="text-xs text-muted-foreground">チャット面接</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">審査待ち</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
              <p className="text-xs text-muted-foreground">申込完了済</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">合格者</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">2次面接案内済</p>
            </CardContent>
          </Card>
        </div>

        {/* 申請者一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>申請者一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">申請日時</th>
                    <th className="text-left p-4">氏名</th>
                    <th className="text-left p-4">希望職種</th>
                    <th className="text-left p-4">連絡先</th>
                    <th className="text-left p-4">ステータス</th>
                    <th className="text-left p-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((applicant) => (
                    <tr key={applicant.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        {new Date(applicant.appliedAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 font-medium">
                        {applicant.personalInfo?.fullName || applicant.phoneInfo?.name || 'N/A'}
                      </td>
                      <td className="p-4">
                        {applicant.personalInfo?.desiredPosition || 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{applicant.personalInfo?.email || 'N/A'}</div>
                          <div className="text-gray-500">
                            {applicant.personalInfo?.phoneNumber || applicant.phoneInfo?.phoneNumber || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(applicant.status)}>
                          {getStatusLabel(applicant.status)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedApplicant(applicant)}
                            >
                              詳細
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{applicant.personalInfo?.fullName || applicant.phoneInfo?.name}様の申請詳細</DialogTitle>
                            </DialogHeader>
                            
                            <Tabs defaultValue="details" className="mt-4">
                              <TabsList>
                                <TabsTrigger value="details">基本情報</TabsTrigger>
                                <TabsTrigger value="interview">面接情報</TabsTrigger>
                                <TabsTrigger value="evaluation">審査</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="font-medium">氏名</label>
                                    <p>{applicant.personalInfo?.fullName || applicant.phoneInfo?.name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">フリガナ</label>
                                    <p>{applicant.personalInfo?.furigana || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">希望職種</label>
                                    <p>{applicant.personalInfo?.desiredPosition || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">年齢</label>
                                    <p>{applicant.personalInfo?.age || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">メールアドレス</label>
                                    <p>{applicant.personalInfo?.email || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">電話番号</label>
                                    <p>{applicant.personalInfo?.phoneNumber || applicant.phoneInfo?.phoneNumber || 'N/A'}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <label className="font-medium">住所</label>
                                    <p>{applicant.personalInfo?.address || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">経験年数</label>
                                    <p>{applicant.personalInfo?.experience || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">入社可能日</label>
                                    <p>{applicant.personalInfo?.availableStartDate || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">免許区分</label>
                                    <p>{applicant.personalInfo?.hasLicense ? applicant.personalInfo?.licenseType || '有り' : '無し'}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium">緊急連絡先</label>
                                    <p>{applicant.personalInfo?.emergencyContact} ({applicant.personalInfo?.emergencyPhone})</p>
                                  </div>
                                </div>
                                {applicant.personalInfo?.motivation && (
                                  <div>
                                    <label className="font-medium">志望動機</label>
                                    <p className="mt-1 p-3 bg-gray-50 rounded">{applicant.personalInfo.motivation}</p>
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="interview" className="space-y-4">
                                {applicant.phoneInfo && (
                                  <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-medium mb-2">電話受付情報</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">受付日時:</span>
                                        <p>{new Date(applicant.phoneInfo.calledAt).toLocaleString('ja-JP')}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">SMS送信:</span>
                                        <Badge variant={applicant.phoneInfo.smsStatus === 'sent' ? 'default' : 'destructive'}>
                                          {applicant.phoneInfo.smsStatus === 'sent' ? '送信済' : '未送信'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {applicant.interviewInfo && (
                                  <div className="p-4 bg-purple-50 rounded-lg">
                                    <h4 className="font-medium mb-2">面接情報</h4>
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">開始日時:</span>
                                          <p>{new Date(applicant.interviewInfo.startedAt).toLocaleString('ja-JP')}</p>
                                        </div>
                                        {applicant.interviewInfo.completedAt && (
                                          <div>
                                            <span className="font-medium">完了日時:</span>
                                            <p>{new Date(applicant.interviewInfo.completedAt).toLocaleString('ja-JP')}</p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {applicant.interviewInfo.responses.length > 0 && (
                                        <div className="mt-4">
                                          <span className="font-medium">面接回答:</span>
                                          <div className="space-y-3 mt-2">
                                            {applicant.interviewInfo.responses.map((response, index) => (
                                              <div key={index} className="bg-white p-3 rounded border-l-4 border-purple-400">
                                                <p className="font-medium text-sm text-purple-700">{response.question}</p>
                                                <p className="mt-1 text-sm">{response.answer}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                  {new Date(response.timestamp).toLocaleString('ja-JP')}
                                                </p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {!applicant.interviewInfo && !applicant.phoneInfo && (
                                  <p className="text-gray-500 text-center py-8">面接情報がありません</p>
                                )}
                              </TabsContent>
                              
                              <TabsContent value="evaluation" className="space-y-4">
                                <div>
                                  <label className="font-medium">評価メモ</label>
                                  <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="評価や面接での印象などをメモしてください..."
                                    rows={4}
                                  />
                                </div>
                                
                                <div>
                                  <label className="font-medium">面接予定日時</label>
                                  <Input
                                    type="datetime-local"
                                    value={interviewDate}
                                    onChange={(e) => setInterviewDate(e.target.value)}
                                  />
                                </div>
                                
                                <div className="flex space-x-3 pt-4">
                                  <Button 
                                    onClick={() => handleStatusUpdate(applicant.id, 'approved')}
                                    disabled={loading || applicant.status !== 'pending_review'}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    合格（2次面接案内送信）
                                  </Button>
                                  <Button 
                                    onClick={() => handleStatusUpdate(applicant.id, 'rejected')}
                                    disabled={loading || applicant.status !== 'pending_review'}
                                    variant="destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    不合格
                                  </Button>
                                </div>

                                <div className="text-sm text-gray-500 mt-2">
                                  {applicant.status !== 'pending_review' && 
                                    `現在のステータス: ${getStatusLabel(applicant.status)}`
                                  }
                                </div>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {applicants.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  申請者がまだいません
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}