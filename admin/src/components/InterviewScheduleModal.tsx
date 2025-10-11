import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getAvailableSlots, scheduleInterview, cancelInterview } from '@/lib/api'
import type { Applicant, AvailableSlot } from '@/types/applicant'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface InterviewScheduleModalProps {
  applicant: Applicant | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InterviewScheduleModal({
  applicant,
  open,
  onOpenChange,
}: InterviewScheduleModalProps) {
  const queryClient = useQueryClient()
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  
  // 今日から2週間先までの空き枠を取得
  const today = new Date()
  const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
  
  const startDate = today.toISOString().split('T')[0]
  const endDate = twoWeeksLater.toISOString().split('T')[0]
  
  // 空き枠取得
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['availableSlots', startDate, endDate],
    queryFn: () => getAvailableSlots(startDate, endDate),
    enabled: open, // モーダルが開いている時のみ実行
  })
  
  // 面接予約登録
  const scheduleMutation = useMutation({
    mutationFn: (interviewDate: string) =>
      scheduleInterview(applicant?.id || '', interviewDate, 60),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
      queryClient.invalidateQueries({ queryKey: ['availableSlots'] })
      toast.success('面接予約を登録しました')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`面接予約に失敗しました: ${error.message}`)
    },
  })
  
  // 面接予約キャンセル
  const cancelMutation = useMutation({
    mutationFn: () => cancelInterview(applicant?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
      queryClient.invalidateQueries({ queryKey: ['availableSlots'] })
      toast.success('面接予約をキャンセルしました')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`予約キャンセルに失敗しました: ${error.message}`)
    },
  })
  
  const handleSchedule = () => {
    if (!selectedSlot) {
      toast.error('面接日時を選択してください')
      return
    }
    scheduleMutation.mutate(selectedSlot)
  }
  
  const handleCancel = () => {
    if (confirm('この面接予約をキャンセルしますか?')) {
      cancelMutation.mutate()
    }
  }
  
  // モーダルが開いた時に選択をリセット
  useEffect(() => {
    if (open) {
      setSelectedSlot('')
    }
  }, [open])
  
  if (!applicant) return null
  
  // 日付ごとにグループ化
  const slotsByDate = slots?.reduce((acc, slot) => {
    const date = slot.date || slot.startTime.split(' ')[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(slot)
    return acc
  }, {} as Record<string, AvailableSlot[]>) || {}
  
  const hasInterview = applicant.interviewDate && applicant.interviewDate.trim() !== ''
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            面接日程調整 - {applicant.applicantName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 現在の予約情報 */}
          {hasInterview && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-blue-900 mb-2">予約済み</p>
                  <div className="flex items-center gap-2 text-blue-800">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(applicant.interviewDate || '')}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      キャンセル
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* 空き枠選択 */}
          <div className="space-y-4">
            <div>
              <Label>面接日時を選択</Label>
              <p className="text-sm text-muted-foreground mt-1">
                カレンダーから空いている日時を選択してください
              </p>
            </div>
            
            {slotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : Object.keys(slotsByDate).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>利用可能な空き枠がありません</p>
                <p className="text-sm mt-2">
                  カレンダー設定を確認するか、別の期間を選択してください
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                  <div key={date} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">
                      {new Date(date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {dateSlots.map((slot) => (
                        <Button
                          key={slot.startTime}
                          variant={selectedSlot === slot.startTime ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedSlot(slot.startTime)}
                          className="w-full"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {slot.time || slot.startTime.split(' ')[1]?.substring(0, 5)}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* アクションボタン */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={scheduleMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={!selectedSlot || scheduleMutation.isPending}
            >
              {scheduleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  予約中...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  面接予約を確定
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
