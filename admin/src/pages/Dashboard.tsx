import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, RefreshCw, UserCheck, Clock, CheckCircle2, Eye, Edit } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApplicantDetailModal } from '@/components/ApplicantDetailModal'
import { StatusUpdateModal } from '@/components/StatusUpdateModal'
import { getApplicants, mockApplicants } from '@/lib/api'
import { formatDate, formatPhoneNumber, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { Applicant, ApplicantFilters } from '@/types/applicant'

export default function Dashboard() {
  const [useMockData] = useState(true) // 開発中はモックデータ使用
  const [filters, setFilters] = useState<ApplicantFilters>({
    status: 'all',
    qualificationStatus: 'all',
    searchQuery: '',
  })
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)

  const { data: applicants, isLoading, refetch } = useQuery({
    queryKey: ['applicants', filters],
    queryFn: async () => {
      if (useMockData) {
        return mockApplicants
      }
      return getApplicants(filters)
    },
  })

  // 統計情報
  const stats = {
    total: applicants?.length || 0,
    screeningCompleted: applicants?.filter(a => a.status === 'screening_completed').length || 0,
    underReview: applicants?.filter(a => a.status === 'under_review').length || 0,
    qualified: applicants?.filter(a => a.status === 'qualified').length || 0,
  }

  const handleViewDetail = (applicant: Applicant) => {
    setSelectedApplicant(applicant)
    setDetailModalOpen(true)
  }

  const handleUpdateStatus = (applicant: Applicant) => {
    setSelectedApplicant(applicant)
    setStatusModalOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総応募者数</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">全期間</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">審査完了</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.screeningCompleted}</div>
              <p className="text-xs text-muted-foreground">確認待ち</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">審査中</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.underReview}</div>
              <p className="text-xs text-muted-foreground">人事審査中</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">合格者</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qualified}</div>
              <p className="text-xs text-muted-foreground">面接予約待ち</p>
            </CardContent>
          </Card>
        </div>

        {/* フィルター＆検索 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>フィルター</CardTitle>
            <CardDescription>応募者を検索・絞り込み</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="応募者名、電話番号で検索..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                />
              </div>
              <div>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ステータス" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="screening_completed">審査完了</SelectItem>
                    <SelectItem value="under_review">審査中</SelectItem>
                    <SelectItem value="qualified">合格</SelectItem>
                    <SelectItem value="disqualified">不合格</SelectItem>
                    <SelectItem value="interview_scheduled">面接予約済み</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={filters.qualificationStatus}
                  onValueChange={(value) => setFilters({ ...filters, qualificationStatus: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="適格性判定" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="適格性高い">適格性高い</SelectItem>
                    <SelectItem value="適格の可能性あり">適格の可能性あり</SelectItem>
                    <SelectItem value="要確認">要確認</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 応募者一覧テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>応募者一覧</CardTitle>
            <CardDescription>
              {isLoading ? '読み込み中...' : `${applicants?.length || 0}件の応募者`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>応募日時</TableHead>
                  <TableHead>応募者名</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>適格性判定</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants?.map((applicant) => (
                  <TableRow key={applicant.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(applicant.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {applicant.applicantName}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatPhoneNumber(applicant.phoneNumber)}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          applicant.status
                        )}`}
                      >
                        {getStatusLabel(applicant.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(applicant)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          詳細
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUpdateStatus(applicant)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          更新
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!isLoading && (!applicants || applicants.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                応募者データがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* モーダル */}
      <ApplicantDetailModal
        applicant={selectedApplicant}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
      <StatusUpdateModal
        applicant={selectedApplicant}
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
      />
    </div>
  )
}
