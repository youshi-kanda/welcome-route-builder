import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, MessageSquare, Send, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { sendNotification } from '@/lib/api'
import type { Applicant } from '@/types/applicant'
import { toast } from 'sonner'

interface NotificationModalProps {
  applicant: Applicant | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationModal({
  applicant,
  open,
  onOpenChange,
}: NotificationModalProps) {
  const queryClient = useQueryClient()
  const [notificationType, setNotificationType] = useState<'qualified' | 'rejected' | 'interview_reminder'>('qualified')
  const [channel, setChannel] = useState<'email' | 'sms' | 'both'>('email')
  
  const sendMutation = useMutation({
    mutationFn: () => sendNotification(applicant?.id || '', notificationType, channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
      toast.success('通知を送信しました')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`通知送信に失敗しました: ${error.message}`)
    },
  })
  
  const handleSend = () => {
    if (!notificationType || !channel) {
      toast.error('通知タイプとチャンネルを選択してください')
      return
    }
    sendMutation.mutate()
  }
  
  if (!applicant) return null
  
  const notificationTypes = [
    { value: 'qualified', label: '合格通知', description: '選考通過をお知らせします' },
    { value: 'rejected', label: '不合格通知', description: '選考結果をお知らせします' },
    { value: 'interview_reminder', label: '面接リマインダー', description: '面接日時の確認連絡' },
  ]
  
  const channels = [
    { value: 'email', label: 'メールのみ', icon: Mail },
    { value: 'sms', label: 'SMSのみ', icon: MessageSquare },
    { value: 'both', label: 'メール + SMS', icon: Send },
  ]
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            通知送信 - {applicant.applicantName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 応募者情報 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">氏名</span>
              <span className="font-medium">{applicant.applicantName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">電話番号</span>
              <span className="font-mono">{applicant.phoneNumber}</span>
            </div>
            {applicant.interviewDate && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">面接日時</span>
                <span className="font-medium">{applicant.interviewDate}</span>
              </div>
            )}
          </div>
          
          {/* 通知タイプ選択 */}
          <div className="space-y-2">
            <Label>通知タイプ</Label>
            <Select 
              value={notificationType} 
              onValueChange={(value: 'qualified' | 'rejected' | 'interview_reminder') => setNotificationType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="通知タイプを選択" />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* チャンネル選択 */}
          <div className="space-y-2">
            <Label>送信方法</Label>
            <div className="grid grid-cols-3 gap-2">
              {channels.map((ch) => {
                const Icon = ch.icon
                return (
                  <Button
                    key={ch.value}
                    variant={channel === ch.value ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-3"
                    onClick={() => setChannel(ch.value as 'email' | 'sms' | 'both')}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{ch.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
          
          {/* 注意事項 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
            <p className="font-medium mb-1">📋 送信前の確認</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>設定ページでテンプレートを確認してください</li>
              <li>SMS送信にはTwilio設定が必要です</li>
              <li>送信後の取り消しはできません</li>
            </ul>
          </div>
          
          {/* アクションボタン */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sendMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  通知を送信
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
