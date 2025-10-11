import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatPhoneNumber, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { Applicant } from '@/types/applicant'

interface ApplicantDetailModalProps {
  applicant: Applicant | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplicantDetailModal({ applicant, open, onOpenChange }: ApplicantDetailModalProps) {
  if (!applicant) return null

  const questions = [
    { label: 'Q1: 応募経路詳細', answer: applicant.step1_answer },
    { label: 'Q2: 欠格事由確認', answer: applicant.step2_answer },
    { label: 'Q3: 勤務期間希望', answer: applicant.step3_answer },
    { label: 'Q4: 志望動機・応募理由', answer: applicant.step4_answer },
    { label: 'Q5: 体力面・業務対応', answer: applicant.step5_answer },
    { label: 'Q6: 経験・スキル・資格', answer: applicant.step6_answer },
    { label: 'Q7: 仕事内容理解度', answer: applicant.step7_answer },
    { label: 'Q8: 責任の重さ認識', answer: applicant.step8_answer },
    { label: 'Q9: 研修・資格意欲', answer: applicant.step9_answer },
    { label: 'Q10: 重視する点', answer: applicant.step10_answer },
    { label: 'Q11: 他社検討状況', answer: applicant.step11_answer },
    { label: 'Q12: 面接準備・質問', answer: applicant.step12_answer },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">応募者詳細情報</DialogTitle>
          <DialogDescription>
            {applicant.applicantName}さんの面接回答内容
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">応募者名</p>
                <p className="font-medium">{applicant.applicantName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">電話番号</p>
                <p className="font-mono text-sm">{formatPhoneNumber(applicant.phoneNumber)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">応募日時</p>
                <p className="text-sm">{formatDate(applicant.timestamp)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">デバイス</p>
                <p className="text-sm">{applicant.deviceType}</p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <div>
                <p className="text-sm text-gray-600 mb-1">適格性判定</p>
                <Badge
                  variant={
                    applicant.qualificationStatus === '適格性高い'
                      ? 'default'
                      : applicant.qualificationStatus === '適格の可能性あり'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {applicant.qualificationStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">ステータス</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    applicant.status
                  )}`}
                >
                  {getStatusLabel(applicant.status)}
                </span>
              </div>
            </div>
          </div>

          {/* 12ステップ回答 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">面接回答内容</h3>
            {questions.map((q, index) => (
              <div key={index} className="space-y-1">
                <p className="text-sm font-medium text-gray-700">{q.label}</p>
                <div className="bg-white border rounded p-3 text-sm">
                  {q.answer || <span className="text-gray-400">回答なし</span>}
                </div>
              </div>
            ))}
          </div>

          {/* 総合結果 */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">総合結果</p>
            <p className="text-blue-800">{applicant.overallResult}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
