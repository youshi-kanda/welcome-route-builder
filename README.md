# ALSOK 一次面接 × SMS システム

ALSOK一次面接の応募受付・事前精査・面接予約をSMSとWebで完結させるシステムです。

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

## 環境変数

プロジェクトルートに `.env` ファイルを作成：

```env
# Cloudflare Workers APIのベースURL
VITE_API_BASE=https://api.example.workers.dev
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

## API連携（Cloudflare Workers）

### エンドポイント仕様

#### POST `/api/sms/send`
SMS送信リクエスト

**リクエストボディ**:
```json
{
  "to": "+81 90 1234 5678",
  "templateId": "receipt",
  "variables": {
    "NAME": "山田 太郎",
    "URL": "https://example.com/chat"
  }
}
```

**レスポンス**:
```json
{
  "success": true,
  "messageId": "SM..."
}
```

#### GET `/api/sms/logs`
SMS送信ログ取得

**クエリパラメータ**:
- `startDate`: 開始日（YYYY-MM-DD）
- `endDate`: 終了日（YYYY-MM-DD）
- `status`: ステータス（queued/sent/failed/delivered）
- `templateId`: テンプレートID（receipt/reserve/remind）
- `offset`: オフセット（ページネーション）
- `limit`: 取得件数

**レスポンス**:
```json
{
  "logs": [
    {
      "id": "1",
      "to": "+81 90 1234 5678",
      "templateId": "receipt",
      "body": "山田様、応募ありがとうございます...",
      "status": "delivered",
      "timestamp": "2025-01-10T10:00:00Z"
    }
  ],
  "total": 100,
  "hasMore": true
}
```

### テンプレートID

- `receipt`: 応募受付確認
- `reserve`: 面接予約案内
- `remind`: 面接リマインダー

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

## ローカルストレージ

最後に入力した電話番号と氏名を保存：
- キー: `alsok_user_data`
- 値: `{ phone: string, name?: string }`

## モックデータ

開発用に `src/lib/api.ts` でモックデータを提供：
- 管理画面で「モックデータ」ボタンで切り替え
- 送信済み・失敗・配信済みのサンプルログ

## デプロイ

### Vercel / Netlify
```bash
npm run build
```

ビルドディレクトリ: `dist`

### 環境変数設定
デプロイ先の環境変数に `VITE_API_BASE` を設定してください。

## ライセンス

© 2025 ALSOK. All rights reserved.

## サポート

お問い合わせ: [support@alsok.co.jp](mailto:support@alsok.co.jp)
