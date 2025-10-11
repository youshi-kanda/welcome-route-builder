import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, saveSettings } from '@/lib/api'
import type { SystemSettings, SettingField } from '@/types/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Calendar, Mail, MessageSquare, Save, AlertCircle } from 'lucide-react'

export default function Settings() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<SystemSettings | null>(null)
  
  // 設定データ取得
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })
  
  // 初回ロード時にフォームデータをセット
  useEffect(() => {
    if (settings && !formData) {
      setFormData(settings)
    }
  }, [settings, formData])
  
  // 設定保存
  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('設定を保存しました')
    },
    onError: (error) => {
      toast.error(`設定の保存に失敗しました: ${error.message}`)
    },
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData) {
      saveMutation.mutate(formData)
    }
  }
  
  const handleChange = (key: keyof SystemSettings, value: string | boolean) => {
    if (formData) {
      setFormData({ ...formData, [key]: value })
    }
  }
  
  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  const calendarFields: SettingField[] = [
    {
      key: 'calendarId',
      label: 'カレンダーID',
      type: 'text',
      placeholder: 'your-calendar@group.calendar.google.com',
      description: 'Google CalendarのカレンダーIDを入力してください',
      required: false,
    },
  ]
  
  const twilioFields: SettingField[] = [
    {
      key: 'twilioAccountSid',
      label: 'Account SID',
      type: 'text',
      placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      description: 'Twilio管理画面から取得できます',
    },
    {
      key: 'twilioAuthToken',
      label: 'Auth Token',
      type: 'password',
      placeholder: '••••••••••••••••••••••••••••••••',
      description: 'Twilio管理画面から取得できます',
    },
    {
      key: 'twilioPhoneNumber',
      label: '送信元電話番号',
      type: 'text',
      placeholder: '+815012345678',
      description: 'Twilioで取得した電話番号',
    },
  ]
  
  const emailFields: SettingField[] = [
    {
      key: 'emailFrom',
      label: '送信元メールアドレス',
      type: 'email',
      placeholder: 'noreply@alsok.co.jp',
      description: 'GASを実行するGoogleアカウントから送信されます',
    },
  ]
  
  const templateFields: SettingField[] = [
    {
      key: 'qualifiedEmailTemplate',
      label: '合格通知メールテンプレート',
      type: 'textarea',
      rows: 10,
      description: '{{name}}, {{interviewDate}}, {{interviewLocation}} が使用可能',
    },
    {
      key: 'rejectedEmailTemplate',
      label: '不合格通知メールテンプレート',
      type: 'textarea',
      rows: 8,
      description: '{{name}} が使用可能',
    },
    {
      key: 'interviewReminderTemplate',
      label: '面接リマインダーメールテンプレート',
      type: 'textarea',
      rows: 8,
      description: '{{name}}, {{interviewDate}}, {{interviewLocation}} が使用可能',
    },
    {
      key: 'qualifiedSmsTemplate',
      label: '合格通知SMSテンプレート',
      type: 'textarea',
      rows: 3,
      description: '{{name}} が使用可能。SMS文字数制限にご注意ください(全角70文字程度)',
    },
    {
      key: 'interviewSmsTemplate',
      label: '面接リマインダーSMSテンプレート',
      type: 'textarea',
      rows: 3,
      description: '{{name}}, {{interviewDate}} が使用可能',
    },
  ]
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">システム設定</h1>
        <p className="text-muted-foreground mt-2">
          Google CalendarやTwilio連携、通知テンプレートを設定できます
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Google Calendar設定 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Google Calendar連携</CardTitle>
            </div>
            <CardDescription>
              面接スケジュール管理用のカレンダー設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="calendarEnabled"
                checked={formData.calendarEnabled}
                onChange={(e) => handleChange('calendarEnabled', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="calendarEnabled">Calendar連携を有効化</Label>
            </div>
            
            {calendarFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={formData[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={!formData.calendarEnabled}
                />
                {field.description && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">カレンダーIDの取得方法:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Google Calendarにアクセス</li>
                  <li>設定から対象カレンダーを選択</li>
                  <li>「カレンダーの統合」セクションの「カレンダーID」をコピー</li>
                  <li>GASを実行するアカウントにカレンダー編集権限を付与</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Twilio設定 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Twilio SMS連携</CardTitle>
            </div>
            <CardDescription>
              SMS通知を送信するためのTwilio API設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="twilioEnabled"
                checked={formData.twilioEnabled}
                onChange={(e) => handleChange('twilioEnabled', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="twilioEnabled">Twilio連携を有効化</Label>
            </div>
            
            {twilioFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={formData[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={!formData.twilioEnabled}
                />
                {field.description && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-medium mb-1">Twilio認証情報の取得:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Twilioアカウントにログイン</li>
                  <li>コンソールダッシュボードから「Account SID」と「Auth Token」を確認</li>
                  <li>電話番号を購入して取得</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* メール通知設定 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>メール通知設定</CardTitle>
            </div>
            <CardDescription>
              GmailAppを使用したメール通知の設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="emailEnabled"
                checked={formData.emailEnabled}
                onChange={(e) => handleChange('emailEnabled', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="emailEnabled">メール通知を有効化</Label>
            </div>
            
            {emailFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={formData[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={!formData.emailEnabled}
                />
                {field.description && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* 通知テンプレート */}
        <Card>
          <CardHeader>
            <CardTitle>通知テンプレート</CardTitle>
            <CardDescription>
              メール・SMS通知のテンプレートをカスタマイズできます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {templateFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Textarea
                  id={field.key}
                  value={formData[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={field.rows}
                  className="font-mono text-sm"
                />
                {field.description && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* 保存ボタン */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => settings && setFormData(settings)}
            disabled={saveMutation.isPending}
          >
            リセット
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                設定を保存
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
