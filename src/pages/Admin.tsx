import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja as jaLocale } from "date-fns/locale";
import { Filter, RotateCcw, RefreshCw } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ja } from "@/i18n/ja";
import { api, mockSmsLogs, type SmsLog } from "@/lib/api";

const statusColors = {
  queued: "bg-warning text-warning-foreground",
  sent: "bg-accent text-accent-foreground",
  failed: "bg-destructive text-destructive-foreground",
  delivered: "bg-success text-success-foreground",
} as const;

const Admin = () => {
  const [useMockData, setUseMockData] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "all",
    templateId: "all",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["smsLogs", filters],
    queryFn: async () => {
      if (useMockData) {
        return { logs: mockSmsLogs, total: mockSmsLogs.length, hasMore: false };
      }
      // Convert "all" to empty string for API
      const apiFilters = {
        ...filters,
        status: filters.status === "all" ? "" : filters.status,
        templateId: filters.templateId === "all" ? "" : filters.templateId,
      };
      return api.getSmsLogs(apiFilters);
    },
  });

  const handleResend = async (log: SmsLog) => {
    try {
      await api.sendSms({
        to: log.to,
        templateId: log.templateId as "receipt" | "reserve" | "remind",
        variables: {},
      });
      toast.success(ja.admin.resendSuccess);
      refetch();
    } catch (error) {
      toast.error(ja.admin.resendError);
    }
  };

  const handleReset = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "all",
      templateId: "all",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy/MM/dd HH:mm", {
        locale: jaLocale,
      });
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] bg-background">
        <div className="container px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {ja.admin.title}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {ja.admin.subtitle}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseMockData(!useMockData)}
              >
                {useMockData ? "モックデータ" : "APIデータ"}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6 p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">{ja.admin.filters}</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm">
                  {ja.admin.startDate}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm">
                  {ja.admin.endDate}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">
                  {ja.admin.status}
                </Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder={ja.admin.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {ja.admin.allStatuses}
                    </SelectItem>
                    <SelectItem value="queued">
                      {ja.admin.status_queued}
                    </SelectItem>
                    <SelectItem value="sent">
                      {ja.admin.status_sent}
                    </SelectItem>
                    <SelectItem value="failed">
                      {ja.admin.status_failed}
                    </SelectItem>
                    <SelectItem value="delivered">
                      {ja.admin.status_delivered}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateId" className="text-sm">
                  {ja.admin.templateId}
                </Label>
                <Select
                  value={filters.templateId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, templateId: value })
                  }
                >
                  <SelectTrigger id="templateId">
                    <SelectValue placeholder={ja.admin.allTemplates} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {ja.admin.allTemplates}
                    </SelectItem>
                    <SelectItem value="receipt">{ja.templates.receipt}</SelectItem>
                    <SelectItem value="reserve">{ja.templates.reserve}</SelectItem>
                    <SelectItem value="remind">{ja.templates.remind}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="default" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {ja.admin.search}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {ja.admin.reset}
              </Button>
            </div>
          </Card>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ja.admin.tableHeaders.to}</TableHead>
                    <TableHead>{ja.admin.tableHeaders.templateId}</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {ja.admin.tableHeaders.body}
                    </TableHead>
                    <TableHead>{ja.admin.tableHeaders.status}</TableHead>
                    <TableHead>{ja.admin.tableHeaders.timestamp}</TableHead>
                    <TableHead className="text-right">
                      {ja.admin.tableHeaders.actions}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        {ja.common.loading}
                      </TableCell>
                    </TableRow>
                  ) : data?.logs && data.logs.length > 0 ? (
                    data.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.to}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {
                              ja.templates[
                                log.templateId as keyof typeof ja.templates
                              ]
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {truncateText(log.body)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[
                                log.status as keyof typeof statusColors
                              ]
                            }
                          >
                            {log.status === "queued" && ja.admin.status_queued}
                            {log.status === "sent" && ja.admin.status_sent}
                            {log.status === "failed" && ja.admin.status_failed}
                            {log.status === "delivered" && ja.admin.status_delivered}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell className="text-right">
                          {log.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(log)}
                            >
                              {ja.admin.resendButton}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        {ja.admin.noData}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
