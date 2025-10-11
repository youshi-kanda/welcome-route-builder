import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { updateApplicantStatus } from '@/lib/api'
import type { Applicant, ApplicantStatus } from '@/types/applicant'

interface StatusUpdateModalProps {
  applicant: Applicant | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusOptions: { value: ApplicantStatus; label: string; description: string }[] = [
  { value: 'screening_completed', label: '審査完了', description: '初期状態（面接完了直後）' },
  { value: 'under_review', label: '審査中', description: '人事が確認中' },
  { value: 'qualified', label: '合格', description: '面接に進める' },
  { value: 'disqualified', label: '不合格', description: '残念ながら今回は見送り' },
  { value: 'interview_scheduled', label: '面接予約済み', description: '面接日時確定' },
  { value: 'interview_completed', label: '面接完了', description: '面接実施済み' },
  { value: 'hired', label: '採用決定', description: '最終的に採用' },
  { value: 'rejected', label: '最終不採用', description: '最終的に不採用' },
]

export function StatusUpdateModal({ applicant, open, onOpenChange }: StatusUpdateModalProps) {
  const [newStatus, setNewStatus] = useState<ApplicantStatus | ''>('')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!applicant || !newStatus) {
        throw new Error('必須項目が不足しています')
      }
      return updateApplicantStatus(applicant.id, newStatus, notes)
    },
    onSuccess: () => {
      toast.success('ステータスを更新しました')
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
      onOpenChange(false)
      setNewStatus('')
      setNotes('')
    },
    onError: (error: Error) => {
      toast.error(`更新に失敗しました: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatus) {
      toast.error('ステータスを選択してください')
      return
    }
    mutation.mutate()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewStatus('')
      setNotes('')
    }
    onOpenChange(open)
  }

  if (!applicant) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>ステータス更新</DialogTitle>
            <DialogDescription>
              {applicant.applicantName}さんのステータスを変更します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-status">現在のステータス</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {statusOptions.find((s) => s.value === applicant.status)?.label || applicant.status}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-status">新しいステータス *</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ApplicantStatus)}>
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">審査メモ（任意）</Label>
              <Textarea
                id="notes"
                placeholder="審査の理由や特記事項を入力..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={mutation.isPending || !newStatus}>
              {mutation.isPending ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
