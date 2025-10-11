# ALSOK 採用システム - 管理者ダッシュボード

応募者の審査、合否判定、面接予約、自動通知を行う管理画面システムです。

## 🎯 主な機能

### 1. 応募者管理
- 応募者一覧表示（フィルタリング・検索）
- 12ステップ面接回答の詳細表示
- 適格性判定の確認
- 統計ダッシュボード

### 2. 合否判定
- ステータス管理（審査中 → 合格/不合格 → 面接予約済み → 完了）
- 審査コメント記録
- 審査履歴管理

### 3. 面接日程調整
- Google Calendar連携で空き枠表示
- 面接日時の予約・変更・キャンセル
- カレンダーイベント自動作成

### 4. 自動通知
- 合格通知（メール/SMS）
- 面接日時の案内
- リマインダー送信

## 📁 プロジェクト構造

```
admin/
├── src/
│   ├── components/
│   │   └── ui/          # UIコンポーネント
│   ├── pages/
│   │   └── Dashboard.tsx  # メインダッシュボード
│   ├── lib/
│   │   ├── api.ts       # API通信
│   │   └── utils.ts     # ユーティリティ
│   ├── types/
│   │   └── applicant.ts # 型定義
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
└── wrangler.toml
```

## 🚀 セットアップ

### 1. 依存関係インストール

```bash
cd admin
npm install
```

### 2. 環境変数設定

`.env.local` ファイルを作成：

```bash
cp .env.example .env.local
```

以下の値を設定：

```env
VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_token
VITE_TWILIO_PHONE_NUMBER=+819012345678
```

### 3. 開発サーバー起動

```bash
npm run dev
```

→ http://localhost:3001 でアクセス

## 🏗️ ビルド＆デプロイ

### ローカルビルド

```bash
npm run build
```

### Cloudflare Pages デプロイ

```bash
npm run pages:deploy
```

または GitHub連携で自動デプロイ：

1. GitHubリポジトリをCloudflare Pagesに接続
2. ビルド設定：
   - **Build command**: `cd admin && npm install && npm run build`
   - **Build output directory**: `admin/dist`
   - **Root directory**: `/`
3. 環境変数を設定（Cloudflare Pages Dashboard）

## 🔐 認証設定

### オプション1: Cloudflare Access（推奨）

1. Cloudflare Dashboardで Access Policy作成
2. 管理者のメールアドレスでアクセス制限
3. Zero Trust認証で安全にアクセス

### オプション2: 独自認証

基本認証またはカスタム認証ロジックを実装

## 🔌 バックエンド連携

### Google Apps Script（GAS）設定

必要なAPI関数：

```javascript
// 応募者一覧取得
function getApplicants(filters) { }

// 応募者詳細取得
function getApplicantDetail(id) { }

// ステータス更新
function updateApplicantStatus(id, status, notes) { }

// カレンダー空き枠取得
function getAvailableSlots(startDate, endDate) { }

// 面接予約登録
function scheduleInterview(applicantId, date, time) { }

// 通知送信
function sendNotification(applicantId, type, template) { }
```

## 📊 データフロー

```
応募者UI (demo-system)
    ↓
Google Sheets（データ保存）
    ↓
管理画面（admin-system）
    ↓
Google Calendar（面接予約）
    ↓
通知送信（Email/SMS）
```

## 🎨 技術スタック

- **React 18** + **TypeScript**
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UIコンポーネント
- **TanStack Query** - データフェッチング
- **Cloudflare Pages** - ホスティング

## 📝 開発メモ

### モックデータ使用

開発中はGAS APIが未完成でもモックデータで動作確認可能：

```typescript
const [useMockData] = useState(true) // src/pages/Dashboard.tsx
```

### デバッグ

```bash
# 開発サーバーのログ確認
npm run dev

# ビルドエラー確認
npm run build
```

## 🔧 トラブルシューティング

### API接続エラー

- GAS URLが正しいか確認
- CORS設定を確認（GAS側で `doPost/doGet` 実装）

### ビルドエラー

```bash
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 📄 ライセンス

Private - ALSOK採用システム専用
