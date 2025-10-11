# ALSOK採用管理システム - 統合デプロイガイド

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://pages.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)

## 📋 システム概要

ALSOK採用管理システムは、応募者の面接から採用までを一元管理するWebアプリケーションです。

### 2つのアプリケーション

```
┌─────────────────────────────────────────────────────────┐
│         GitHub Repository                                │
│         youshi-kanda/welcome-route-builder              │
├──────────────────────────┬──────────────────────────────┤
│                          │                               │
│  demo-system ブランチ    │  feature/admin-system        │
│  (応募者向けUI)          │  (管理画面)                   │
│                          │                               │
│  ├─ index.html          │  ├─ admin/                   │
│  ├─ src/                │  │  ├─ src/                  │
│  ├─ security-screening  │  │  ├─ vite.config.ts        │
│  └─ vite.config.ts      │  │  └─ package.json          │
│                          │  └─ DEPLOY.md                │
└────────────┬─────────────┴────────────┬──────────────────┘
             │                          │
             ↓                          ↓
   ┌──────────────────┐      ┌──────────────────────┐
   │ Cloudflare Pages │      │ Cloudflare Pages     │
   │ alsok-demo       │      │ alsok-admin-dashboard│
   │ (Public)         │      │ (Protected)          │
   └──────────────────┘      └──────────────────────┘
             │                          │
             └──────────┬───────────────┘
                        ↓
              ┌──────────────────┐
              │ Google Apps Script│
              │ (Backend API)     │
              └──────────────────┘
                        ↓
              ┌──────────────────┐
              │ Google Sheets     │
              │ (Database)        │
              └──────────────────┘
```

## 🚀 デプロイ方法

### 1. 応募者UIのデプロイ

**ブランチ**: `demo-system`  
**URL**: https://alsok-demo.pages.dev

#### Cloudflare Pages設定
```
Project name: alsok-demo
Production branch: demo-system
Build command: npm install && npm run build
Build output directory: dist
Root directory: /
```

#### 環境変数
```
VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
NODE_VERSION=20
```

### 2. 管理画面のデプロイ

**ブランチ**: `feature/admin-system`  
**URL**: https://alsok-admin-dashboard.pages.dev

#### Cloudflare Pages設定
```
Project name: alsok-admin-dashboard
Production branch: feature/admin-system
Build command: cd admin && npm install && npm run build
Build output directory: admin/dist
Root directory: /
```

#### 環境変数
```
VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
NODE_VERSION=20
```

詳細は [admin/DEPLOY.md](./admin/DEPLOY.md) を参照してください。

## 🔧 ローカル開発

### 応募者UI
```bash
# ルートディレクトリで
npm install
npm run dev
# http://localhost:5173
```

### 管理画面
```bash
cd admin
npm install
npm run dev
# http://localhost:3001
```

## 📦 ビルドとプレビュー

### 応募者UI
```bash
npm run build
npm run preview
```

### 管理画面
```bash
cd admin
npm run build
npm run preview
```

## 🔐 セキュリティ設定

### 管理画面へのアクセス制御

#### Option 1: Cloudflare Access（推奨）
1. Cloudflare Dashboard → Zero Trust
2. Access → Applications → Add application
3. Domain: `alsok-admin-dashboard.pages.dev`
4. Policy: Email認証 または Google Workspace

#### Option 2: 基本認証
管理画面にパスワード認証を実装（Task 10で実装予定）

## 🌐 カスタムドメイン設定

### 応募者UI
```
Cloudflare Pages → Custom domains
Domain: recruit.alsok.co.jp
```

### 管理画面
```
Cloudflare Pages → Custom domains
Domain: admin-recruit.alsok.co.jp
```

## 📊 モニタリング

### Cloudflare Analytics
- ページビュー
- ユニークビジター
- エラー率
- パフォーマンスメトリクス

### Google Sheets ログ
- 応募データ
- SMS送信履歴
- エラーログ

## 🔄 CI/CD パイプライン

### 自動デプロイ
- `demo-system` ブランチへのpush → 応募者UIを自動デプロイ
- `feature/admin-system` ブランチへのpush → 管理画面を自動デプロイ

### 手動デプロイ
```bash
# 応募者UI
npm run pages:deploy

# 管理画面
cd admin
npm run pages:deploy
```

## 🛠️ トラブルシューティング

### ビルドエラー

**問題**: `Cannot find module '@/components/...'`

**解決策**:
```bash
# パスエイリアスの確認
cat vite.config.ts
# または
cat admin/vite.config.ts
```

### CORS エラー

**問題**: GAS APIへのリクエストがブロックされる

**解決策**:
GASスクリプトで適切なレスポンスヘッダーを設定:
```javascript
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 環境変数が反映されない

**問題**: `VITE_GAS_API_URL` が undefined

**解決策**:
1. Cloudflare Dashboard → Settings → Environment variables
2. 変数を追加
3. 再デプロイ

## 📚 ドキュメント

- [応募者UI README](./README.md)
- [管理画面デプロイガイド](./admin/DEPLOY.md)
- [GAS API仕様](./infra/gas/API_SPEC.md)
- [スプレッドシート設計](./spreadsheet-schema.md)

## 🤝 貢献

### ブランチ戦略
- `main`: 本番環境（未使用）
- `demo-system`: 応募者UI本番環境
- `feature/admin-system`: 管理画面本番環境
- `feature/*`: 新機能開発

### プルリクエスト
1. 機能ブランチを作成
2. 変更をコミット
3. テストを実行
4. PRを作成

## 📝 ライセンス

Private - ALSOK内部使用

## 📞 サポート

問題が発生した場合:
1. [Issues](https://github.com/youshi-kanda/welcome-route-builder/issues)で検索
2. 新しいIssueを作成
3. デプロイログを添付

---

**Last Updated**: 2025-10-11  
**Version**: 1.0.0
