# restaurant-manager

このリポジトリは Nuxt 3 で作られたレシピ／原材料／店舗／店員を管理するアプリケーションです。

以下はローカルでのビルド方法と Render へのデプロイ手順（Managed Postgres を利用する場合の手順を含む）です。

## 前提
- Git リポジトリが作成され、リモート（例: GitHub）に push できること
- Node.js と npm がローカルにインストールされていること

## 1. ローカルでのビルドと動作確認

1. 依存パッケージをインストール

```bash
npm ci
```

2. 開発サーバーで動作確認

```bash
npm run dev
```

3. 本番ビルド（ローカルで確認したい場合）

```bash
npm run build
# ビルド後にプレビュー
npm run preview
```

※ `package.json` には本番起動用に `start` スクリプト（`nuxt start`）が含まれています。

## 2. デプロイ（Render を使う場合）

### A. リポジトリ準備
1. 機密情報（`DATABASE_URL` や `.env` ファイル等）をリポジトリに含めないでください。
   - `.gitignore` に `.env` や `*.local` を追加
   - 本番の接続文字列などは Render のダッシュボードの環境変数に設定します。

2. 変更をコミットしてリモートへ push

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### B. Render 側で Web Service を作成
1. https://dashboard.render.com にログイン → **New** → **Web Service**
2. GitHub（または GitLab/Bitbucket）を接続し、対象リポジトリとブランチ（例: `main`）を選択
3. 環境: `Node`
4. Build Command:

```
npm ci && npm run build
```

5. Start Command:

```
npm run start
```

6. インスタンスのプランやリージョンを選択して作成

### C. (任意) Render の Managed Postgres を作成
1. Render ダッシュボード → **New** → **Postgres** でデータベースを作成
2. 作成後、接続文字列（`DATABASE_URL`）を取得
3. Web Service の Environment に `DATABASE_URL` を追加（値に先ほどの接続文字列を貼り付け）

### D. DB スキーマを作成／マイグレーション
ローカルから `psql` を使って `schema.sql` を適用するか、Render の接続情報で実行します。

```bash
psql "<your DATABASE_URL>" -f schema.sql
```

既存テーブルに `price` カラムを追加する場合:

```sql
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0;
```

※ 本番実行前にバックアップを取り、マイグレーションは慎重に行ってください。

### E. デプロイ確認
- Render がビルド→デプロイを実行します。ログにエラーがないか確認してください。
- 公開 URL にアクセスし、`/`, `/calculator`, `/billing`、および API (`/api/recipes`, `/api/materials`) を確認します。

## 3. render.yaml の利用
リポジトリに `render.yaml` を含めている場合は Render のインポート機能で設定を適用できます。`render.yaml` の `repo` フィールドはあなたの GitHub リポジトリ名に書き換えてください。

## 4. セキュリティ・機密情報の扱い
- `DATABASE_URL` や API キーはリポジトリに含めないでください。必ず環境変数としてホスト側（Render）に設定します。
- もし誤ってコミットしてしまった場合は、そのキーを無効化（ローテーション）し、履歴から削除する（`git-filter-repo` や BFG）ことを推奨します。

簡単なチェック例:

```bash
# 機密らしい文字列がないか簡易検索
grep -RIn --exclude-dir=.git -e 'DATABASE_URL\|PASSWORD\|SECRET\|TOKEN\|API_KEY' . || true
```

## 5. Docker イメージからデプロイする場合（公開リポジトリにしたくない場合の代替）
- アプリを Docker イメージ化して Docker Hub やプライベート Registry にプッシュし、Render でイメージからデプロイできます。

## 6. ローカルでの便利コマンドまとめ

```bash
# 依存インストール
npm ci
# 開発
npm run dev
# ビルド
npm run build
# プレビュー
npm run preview
```
