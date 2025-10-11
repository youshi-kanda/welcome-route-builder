import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, RefreshCw, UserCheck, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getApplicants, mockApplicants } from '@/lib/api'
import { formatDate, formatPhoneNumber, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { ApplicantFilters } from '@/types/applicant'

export default function Dashboard() {
  const [useMockData] = useState(true) // 開発中はモックデータ使用
  const [filters, setFilters] = useState<ApplicantFilters>({
    status: 'all',
    qualificationStatus: 'all',
  })

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ALSOK採用システム - 管理者ダッシュボード
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                応募者の審査・面接予約・通知管理
              </p>
            </div>
            <Button onClick={() => refetch()} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              更新
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="応募者名、電話番号で検索..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full"
                />
              </div>
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                検索
              </Button>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                詳細フィルター
              </Button>
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
                  <TableHead>アクション</TableHead>
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
                    <TableCell>
                      <Button variant="outline" size="sm">
                        詳細
                      </Button>
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
      </main>
    </div>
  )
}
