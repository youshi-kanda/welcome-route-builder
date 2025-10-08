# ALSOK 面接システム - フロントエンド

ALSOK面接システムのフロントエンド部分です。応募受付から二次面接までの自動化されたワークフローを提供します。

## 🏗️ システム構成

このフロントエンドは以下のバックエンドと連携して動作します：
- **Cloudflare Workers**: APIゲートウェイ
- **Google Apps Script**: スプレッドシート操作・カレンダー統合
- **Twilio**: SMS送受信
- **Google Sheets**: データストレージ（SSOT）

## 機能概要

### 🏠 応募受付ページ (`/`)
- 電話番号（E.164形式）と氏名を入力
- SMS送信の同意チェックボックス
- 事前確認リンクをSMSで送信

### 💬 事前精査チャット (`/chat`)
- 7つの質問に段階的に回答
- 進捗ステッパーで現在位置を表示
- 最終画面で面接予約SMSを送信

### 📅 面接予約ページ (`/reserve`)
- カレンダーから面接日を選択
- 時間帯セレクト（09:00-17:00）
- SMSリマインダーの有効/無効設定
- 予約確定とSMS送信

### ⚙️ 管理ダッシュボード (`/admin`)
- SMS送信ログの一覧表示
- 日付・ステータス・テンプレートIDでフィルタリング
- 失敗メッセージの再送機能
- モックデータ/API切り替え

## 技術スタック

- **フレームワーク**: React 18 + Vite
- **TypeScript**: 型安全な開発
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: shadcn/ui
- **フォーム管理**: React Hook Form + Zod
- **データ取得**: TanStack Query
- **ルーティング**: React Router v6
- **通知**: Sonner (Toast)
- **日付**: date-fns

## プロジェクト構成

```
src/
├── components/
│   ├── layout/          # レイアウトコンポーネント
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Layout.tsx
│   └── ui/              # UIコンポーネント（shadcn）
│       ├── button.tsx
│       ├── input.tsx
│       ├── form-input-phone.tsx
│       ├── consent-checkbox.tsx
│       └── ...
├── pages/               # ページコンポーネント
│   ├── Home.tsx         # 応募受付
│   ├── Chat.tsx         # 事前精査チャット
│   ├── Reserve.tsx      # 面接予約
│   ├── Admin.tsx        # 管理ダッシュボード
│   └── NotFound.tsx
├── i18n/                # 国際化（日本語）
│   └── ja.ts
├── lib/                 # ユーティリティ
│   ├── api.ts           # API呼び出しとモックデータ
│   ├── validation.ts    # バリデーションスキーマ
│   └── utils.ts
├── index.css            # デザインシステム
└── App.tsx              # アプリケーションルート
```

## 🔧 環境変数

プロジェクトルートに `.env.local` ファイルを作成：

```bash
# Cloudflare Workers API ベースURL（本番用）
VITE_API_BASE=https://alsok-interview-system.your-subdomain.workers.dev

# 開発時のローカルURL  
# VITE_API_BASE=http://localhost:8787

# タイムゾーン設定
VITE_DEFAULT_TZ=Asia/Tokyo

# デバッグモード（開発時のみ）
VITE_DEBUG_MODE=false

# アプリケーション情報
VITE_APP_NAME=ALSOK採用システム
VITE_APP_VERSION=1.0.0
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:8080` を開きます。

### 3. ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

## 🎯 ALSOK本番システム

本システムは実際のALSOK採用プロセスで使用される本番システムです。

## 🔗 API連携（ALSOK システム）

### 主要エンドポイント

#### POST `/api/applications`
応募受付

**リクエストボディ**:
```json
{
  "name": "山田太郎",
  "phone": "+819012345678",
  "source": "Web",
  "consent_flg": true,
  "notes": ""
}
```

**レスポンス**:
```json
{
  "ok": true,
  "applicant_id": "app_abc123"
}
```

#### POST `/api/sms/send`
SMS送信

**リクエストボディ**:
```json
{
  "to": "+819012345678",
  "templateId": "app_received",
  "variables": {
    "NAME": "山田太郎",
    "APPLICANT_ID": "app_abc123"
  },
  "applicant_id": "app_abc123"
}
```

**レスポンス**:
```json
{
  "ok": true,
  "sid": "SMxxxxx",
  "status": "queued"
}
```

#### POST `/api/second/next-slot`
次の面接枠取得

**リクエストボディ**:
```json
{
  "interviewer_id": "interviewer_001"
}
```

**レスポンス**:
```json
{
  "ok": true,
  "slotAt": "2025-10-09T14:00:00+09:00"
}
```

#### GET `/api/sms/logs`
SMS送信ログ取得（管理画面用）

**レスポンス**:
```json
{
  "logs": [
    {
      "id": "msg_001",
      "applicant_id": "app_abc123",
      "at": "2025-10-06T10:00:00+09:00",
      "channel": "sms",
      "direction": "out",
      "content": "山田様、ALSOK採用チームです。応募を受け付けました...",
      "operator": "system",
      "templateId": "app_received",
      "status": "delivered"
    }
  ]
}
```

### ALSOKテンプレートID

- `app_received`: 応募受付確認
- `chat_completed`: 事前質問完了通知
- `2nd_schedule`: 二次面接時間指定
- `2nd_confirmed`: 二次面接確定通知
- `reminder`: 面接リマインダー

### エラーハンドリング

- タイムアウト: 10秒
- 自動リトライ: 1回
- CORSエラー、ネットワークエラーはトースト通知

## デザインシステム

### カラーパレット

**プライマリ（ALSOK Blue）**:
- `--primary`: 信頼性と安全性を表す青
- `--primary-hover`: ホバー時の濃い青

**セカンダリ**:
- `--secondary`: 淡い青（サブアクション）

**ステータスカラー**:
- `--success`: 緑（成功）
- `--warning`: オレンジ（警告）
- `--destructive`: 赤（エラー）

### タイポグラフィ

- **見出し**: font-bold, 2xl-4xl
- **本文**: text-base (16px) - iOS zoom防止
- **補足**: text-sm, text-xs

### コンポーネントバリアント

**Button**:
- `default`: プライマリボタン
- `outline`: アウトラインボタン
- `success`: 成功ボタン
- `warning`: 警告ボタン
- サイズ: `sm`, `lg`, `xl`（モバイル向け大型ボタン）

## アクセシビリティ

- フォーム要素に対応する `<label>` と `for/id`
- エラーメッセージに `aria-invalid`, `aria-describedby`
- `aria-live` でリアルタイム通知
- キーボード操作対応（Tab順、フォーカスリング）
- コントラスト比 WCAG AA準拠

## バリデーション

### 電話番号
- E.164形式（+から始まる10-15桁の数字）
- 空白・ハイフンは自動除去
- 日本語エラーメッセージ

### 必須チェック
- 同意チェックボックス必須
- 日付・時間選択必須

## 💾 ローカルストレージ

ユーザー情報を一時保存：
- キー: `alsok_user_data`
- 値: `{ phone: string, name?: string, applicant_id?: string }`
- キー: `alsok_applicant_id`  
- 値: `app_abc123` （受付番号）

## 🗂️ データフロー

```
1. 応募受付 → applicant_id生成 → Applicantsシートに登録
2. SMS送信 → Twilio → Messagesシートにログ
3. 質問完了 → 完了SMS送信 → ステータス更新
4. 予約選択 → 確定SMS送信 → カレンダー登録（実際の運用では「指定送付」）
```

## 🧪 テスト・デバッグ機能

### モックデータ
開発用に `src/lib/api.ts` でALSOK仕様のモックデータを提供：
- 管理画面で「モックデータ/APIデータ」ボタンで切り替え
- ALSOK形式のSMSログサンプル（Messages形式）
- 送信・受信・システムログの混在データ

### デバッグモード
`VITE_DEBUG_MODE=true` で詳細ログ出力：
- API呼び出し詳細
- レスポンスデータ
- エラー詳細情報

## 🚀 ALSOKシステム統合確認

### 受け入れ基準
1. ✅ 応募受付 → Applicantsシートに登録 → applicant_id表示
2. ✅ 質問完了 → 完了SMS送信 → 次段階への遷移
3. ✅ 予約確定 → 確定SMS送信（実運用では指定送付に対応）
4. ✅ 全イベントがSheetsにログ記録

### 統合テスト手順
1. フロントエンド起動 (`npm run dev`)
2. Cloudflare Workers 起動 (`wrangler dev`)
3. GAS WebApp 確認
4. Twilio設定確認
5. E2Eテスト実行

## 🚀 デプロイ

### 推奨デプロイ先
- **Vercel**: 自動CI/CD、独自ドメイン対応
- **Netlify**: 静的サイトホスティング  
- **Cloudflare Pages**: Workers統合

### デプロイコマンド
```bash
# 本番ビルド
npm run build

# Vercel
vercel --prod

# Netlify  
netlify deploy --prod --dir=dist

# Cloudflare Pages
wrangler pages publish dist
```

### 環境変数設定（本番）
```bash
VITE_API_BASE=https://alsok-interview-system.your-subdomain.workers.dev
VITE_DEFAULT_TZ=Asia/Tokyo
VITE_DEBUG_MODE=false
VITE_APP_NAME=ALSOK採用システム
VITE_APP_VERSION=1.0.0
```

## 📋 運用チェックリスト

### 本番移行前確認
- [ ] 環境変数設定完了
- [ ] API接続テスト成功
- [ ] SMS送受信テスト成功
- [ ] レスポンシブ表示確認
- [ ] エラーハンドリング動作確認
- [ ] 管理画面アクセス制御確認

### 定期メンテナンス
- [ ] SSL証明書有効期限確認
- [ ] API使用量監視
- [ ] パフォーマンス測定
- [ ] セキュリティアップデート適用

## ライセンス

© 2025 ALSOK. All rights reserved.

## サポート

お問い合わせ: [support@alsok.co.jp](mailto:support@alsok.co.jp)
