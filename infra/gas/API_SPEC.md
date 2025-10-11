# ALSOK採用システム - Google Apps Script API仕様

管理画面用のAPI関数群とデータ構造の説明

## 📡 エンドポイント

**デプロイURL**: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

## 🔍 GET API（読み取り専用）

### 1. 応募者一覧取得

**エンドポイント**: `GET ?action=getApplicants`

**パラメータ**:
- `startDate` (optional): 開始日時 (YYYY-MM-DD HH:mm:ss)
- `endDate` (optional): 終了日時 (YYYY-MM-DD HH:mm:ss)
- `status` (optional): ステータスフィルター
  - `all` (デフォルト)
  - `screening_completed` - 審査完了
  - `under_review` - 審査中
  - `qualified` - 合格
  - `disqualified` - 不合格
  - `interview_scheduled` - 面接予約済み
  - `interview_completed` - 面接完了
- `qualificationStatus` (optional): 適格性判定フィルター
  - `all` (デフォルト)
  - `要確認`
  - `適格の可能性あり`
  - `適格性高い`
- `searchQuery` (optional): 検索キーワード（応募者名・電話番号）
- `page` (optional): ページ番号（デフォルト: 1）
- `pageSize` (optional): ページサイズ（デフォルト: 50）

**レスポンス例**:
```json
{
  "success": true,
  "applicants": [
    {
      "id": "2",
      "timestamp": "2025-01-11 10:30:00",
      "applicantName": "山田太郎",
      "phoneNumber": "+81901234567",
      "applicationSource": "AI面接チャットbot",
      "step1_answer": "Indeed",
      "step2_answer": "いいえ、該当しません",
      "step3_answer": "長期勤務を希望します",
      "step4_answer": "人々の安全を守る仕事に...",
      "step5_answer": "体力には自信があります",
      "step6_answer": "接客業経験5年、普通自動車免許",
      "step7_answer": "施設警備、イベント警備...",
      "step8_answer": "責任の重さを理解し...",
      "step9_answer": "警備員検定の取得を...",
      "step10_answer": "チームワークを重視...",
      "step11_answer": "御社が第一志望です",
      "step12_answer": "研修制度について...",
      "qualificationStatus": "適格性高い",
      "overallResult": "面接推奨",
      "completionTime": "2025-01-11 10:45:00",
      "deviceType": "スマートフォン",
      "status": "screening_completed",
      "reviewNotes": "",
      "interviewDate": "",
      "interviewTime": ""
    }
  ],
  "total": 15,
  "page": 1,
  "pageSize": 50,
  "totalPages": 1
}
```

### 2. 応募者詳細取得

**エンドポイント**: `GET ?action=getApplicantDetail&id=2`

**パラメータ**:
- `id` (required): 応募者ID（行番号）

**レスポンス例**:
```json
{
  "success": true,
  "applicant": {
    "id": "2",
    "timestamp": "2025-01-11 10:30:00",
    "applicantName": "山田太郎",
    ...
  }
}
```

### 3. カレンダー空き枠取得（未実装）

**エンドポイント**: `GET ?action=getAvailableSlots&startDate=2025-01-15&endDate=2025-01-20`

**パラメータ**:
- `startDate` (required): 開始日 (YYYY-MM-DD)
- `endDate` (required): 終了日 (YYYY-MM-DD)

**レスポンス例**:
```json
{
  "success": true,
  "slots": [
    {
      "date": "2025-01-15",
      "startTime": "10:00",
      "endTime": "11:00",
      "available": true
    }
  ]
}
```

## ✏️ POST API（書き込み・更新）

### 1. 応募者ステータス更新

**エンドポイント**: `POST`

**リクエストボディ**:
```json
{
  "action": "updateApplicantStatus",
  "id": "2",
  "status": "qualified",
  "notes": "面接を実施します"
}
```

**パラメータ**:
- `action` (required): `updateApplicantStatus`
- `id` (required): 応募者ID
- `status` (required): 新しいステータス
- `notes` (optional): 審査メモ

**レスポンス例**:
```json
{
  "success": true,
  "message": "ステータスを更新しました",
  "id": "2",
  "status": "qualified"
}
```

### 2. 面接予約登録（未実装）

**エンドポイント**: `POST`

**リクエストボディ**:
```json
{
  "action": "scheduleInterview",
  "applicantId": "2",
  "date": "2025-01-15",
  "time": "10:00"
}
```

**レスポンス例**:
```json
{
  "success": true,
  "message": "面接予約が完了しました",
  "eventId": "calendar_event_id_xxx"
}
```

### 3. 通知送信（未実装）

**エンドポイント**: `POST`

**リクエストボディ**:
```json
{
  "action": "sendNotification",
  "applicantId": "2",
  "type": "email",
  "template": "qualification"
}
```

## 📊 データ構造

### スプレッドシート列構成

| 列 | 項目名 | 説明 |
|---|---|---|
| A | 応募日時 | 応募受付日時 |
| B | 応募者名 | 氏名 |
| C | 電話番号 | E.164形式 |
| D | 応募経路 | 応募元 |
| E-P | Q1-Q12 | 12ステップの回答 |
| Q | 適格性判定 | AI自動判定結果 |
| R | 総合結果 | 判定サマリー |
| S | 完了時間 | 面接完了時刻 |
| T | デバイス種別 | PC/スマホ |
| U-AA | メタデータ | IP、UA、セッション等 |
| **AB** | **ステータス** | **管理画面で管理** |
| **AC** | **審査メモ** | **人事コメント** |
| **AD** | **更新日時** | **最終更新** |
| **AE** | **面接日時** | **予約日時** |
| **AF** | **カレンダーID** | **Googleカレンダー** |

### ステータス一覧

| ステータス | 説明 | 次のアクション |
|---|---|---|
| `screening_completed` | 審査完了（初期） | 人事が確認 |
| `under_review` | 審査中 | 合否判定待ち |
| `qualified` | 合格 | 面接日程調整 |
| `disqualified` | 不合格 | 通知送信 |
| `interview_scheduled` | 面接予約済み | 面接実施待ち |
| `interview_completed` | 面接完了 | 最終判定 |
| `hired` | 採用決定 | - |
| `rejected` | 最終不採用 | - |

## 🔐 認証・セキュリティ

### デプロイ設定

1. Google Apps Scriptエディタで「デプロイ」→「新しいデプロイ」
2. 種類: **ウェブアプリ**
3. 次のユーザーとして実行: **自分**
4. アクセスできるユーザー: **全員**（管理画面側で認証）

### CORS対応

GASは自動的にCORSヘッダーを返すため、追加設定不要。

### エラーハンドリング

すべてのAPIは以下の形式でエラーを返します：

```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

## 🧪 テスト方法

### cURLでテスト

```bash
# ステータス確認
curl "https://script.google.com/macros/s/YOUR_ID/exec?action=status"

# 応募者一覧取得
curl "https://script.google.com/macros/s/YOUR_ID/exec?action=getApplicants"

# ステータス更新
curl -X POST "https://script.google.com/macros/s/YOUR_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateApplicantStatus",
    "id": "2",
    "status": "qualified",
    "notes": "合格"
  }'
```

## 📝 実装メモ

### 完了済み
- ✅ 応募者一覧取得（フィルタリング・ページネーション）
- ✅ 応募者詳細取得
- ✅ ステータス更新
- ✅ スプレッドシート列拡張（管理用フィールド追加）

### 次タスクで実装
- ⏳ Google Calendar API連携
- ⏳ 面接予約登録
- ⏳ 通知送信（Email/SMS）
