# ALSOK管理画面 - Cloudflare Pages デプロイガイド

## 📋 概要

このドキュメントでは、ALSOK採用管理システムの管理画面をCloudflare Pagesにデプロイする手順を説明します。

## 🏗️ アーキテクチャ

```
┌─────────────────────────────────────────────┐
│  GitHub Repository                           │
│  youshi-kanda/welcome-route-builder         │
├──────────────────┬──────────────────────────┤
│                  │                           │
│  demo-system     │  feature/admin-system    │
│  (応募者UI)      │  (管理画面)              │
│                  │                           │
└────────┬─────────┴────────────┬──────────────┘
         │                      │
         ↓                      ↓
┌─────────────────┐   ┌──────────────────────┐
│ Cloudflare Pages│   │ Cloudflare Pages     │
│ Project #1      │   │ Project #2           │
│ alsok-demo      │   │ alsok-admin-dashboard│
└─────────────────┘   └──────────────────────┘
```

## 🚀 デプロイ手順

### Step 1: Cloudflare Dashboardにアクセス

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左サイドバーから **Workers & Pages** を選択
3. **Create application** → **Pages** → **Connect to Git** をクリック

### Step 2: GitHubリポジトリ連携

1. **Connect GitHub account** をクリック
2. `youshi-kanda/welcome-route-builder` を選択
3. **Begin setup** をクリック

### Step 3: プロジェクト設定

#### 基本設定
- **Project name**: `alsok-admin-dashboard`
- **Production branch**: `feature/admin-system`

#### ビルド設定
```
Framework preset: None (または Vite)
Build command: cd admin && npm install && npm run build
Build output directory: admin/dist
Root directory: /
```

#### 環境変数
以下の環境変数を設定:

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `VITE_GAS_API_URL` | `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec` | GAS WebアプリのURL |
| `NODE_VERSION` | `20` | Node.jsバージョン |

### Step 4: デプロイ実行

1. **Save and Deploy** をクリック
2. ビルドログを確認
3. デプロイ完了後、自動生成されたURLにアクセス
   - 例: `https://alsok-admin-dashboard.pages.dev`

## 🔧 カスタムドメイン設定（オプション）

1. Pages プロジェクトの **Custom domains** タブを開く
2. **Set up a custom domain** をクリック
3. ドメインを入力（例: `admin.alsok-recruit.com`）
4. DNS設定を確認・適用

## 🔐 環境変数の更新

### Cloudflare Dashboard から

1. プロジェクトの **Settings** → **Environment variables** を開く
2. 変数を追加/編集
3. **Save** をクリック
4. 再デプロイが自動実行される

### Wrangler CLI から（ローカル）

```bash
cd admin
npx wrangler pages project create alsok-admin-dashboard
npx wrangler pages deployment create
```

## 📦 ローカルビルドテスト

デプロイ前に動作確認:

```bash
cd admin
npm install
npm run build
npm run preview
```

ブラウザで `http://localhost:4173` を開く

## 🔄 継続的デプロイ (CI/CD)

### 自動デプロイ設定

Cloudflare Pagesは以下の場合に自動デプロイされます:
- `feature/admin-system` ブランチへのpush
- プルリクエストのマージ

### 手動デプロイ

```bash
cd admin
npm run pages:deploy
```

## 🛡️ セキュリティ設定

### Cloudflare Access 設定（推奨）

1. Cloudflare Dashboard → **Zero Trust**
2. **Access** → **Applications** → **Add an application**
3. アプリケーション設定:
   - **Name**: ALSOK Admin Dashboard
   - **Domain**: `alsok-admin-dashboard.pages.dev` (または custom domain)
   - **Policy**: Email認証 または Google Workspace認証

### 基本認証（簡易版）

管理画面に認証機能を追加する場合は、Task 10で実装予定。

## 📊 デプロイステータス確認

### Cloudflare Dashboard

1. プロジェクトページの **Deployments** タブ
2. 最新デプロイのステータスを確認
3. ログを確認してエラーをチェック

### デプロイバッジ（README用）

```markdown
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://alsok-admin-dashboard.pages.dev)
```

## 🐛 トラブルシューティング

### ビルドエラー: "Cannot find module"

**原因**: 依存関係のインストール失敗

**解決策**:
```bash
cd admin
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ランタイムエラー: "GAS API URL not found"

**原因**: 環境変数 `VITE_GAS_API_URL` が未設定

**解決策**:
1. Cloudflare Dashboard → Settings → Environment variables
2. `VITE_GAS_API_URL` を追加
3. 再デプロイ

### CORS エラー

**原因**: GAS WebアプリのCORS設定

**解決策**:
GASスクリプトで以下を確認:
```javascript
function doGet(e) {
  const response = ContentService.createTextOutput(JSON.stringify(data));
  response.setMimeType(ContentService.MimeType.JSON);
  return response;
}
```

## 📝 次のステップ

- [ ] カスタムドメイン設定
- [ ] Cloudflare Access 認証設定
- [ ] 本番用GAS URLの設定
- [ ] モニタリング・アラート設定
- [ ] バックアップ戦略の策定

## 🔗 関連リンク

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Vite デプロイガイド](https://vitejs.dev/guide/static-deploy.html)
- [GAS Web Apps](https://developers.google.com/apps-script/guides/web)

---

**デプロイ完了後**: 管理画面の設定ページでGoogleカレンダーIDとTwilio認証情報を入力してください。
