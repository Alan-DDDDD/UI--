# 🚀 部署指南

## 架構概覽
- **前端**: GitHub Pages (靜態網站)
- **後端**: Vercel (Serverless Functions)
- **資料**: JSON 檔案儲存

## 前端部署 (GitHub Pages)

### 自動部署
1. 推送代碼到 `main` 或 `master` 分支
2. GitHub Actions 自動構建和部署
3. 訪問 `https://alan-ddddd.github.io/UI--`

## 後端部署 (Vercel)

### 自動部署
1. 連接 GitHub repository 到 Vercel
2. 設定 Root Directory 為根目錄
3. 推送代碼自動部署到 `https://ui-flow-api.vercel.app`

### 手動部署
```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## 本地開發

```bash
# 安裝依賴
npm run install-all

# 開發模式
npm run dev

# 測試
npm test
```

## 環境變數

### 前端 (.env.production)
```
REACT_APP_API_URL=https://ui-flow-api.vercel.app
```

### 後端 (Vercel 環境變數)
```
NODE_ENV=production
```

## LINE Bot 設定

1. Webhook URL: `https://ui-flow-api.vercel.app/webhook/line/{workflowId}`
2. 需要 HTTPS 支援 (Vercel 自動提供)
3. 在應用內的 Token 管理添加 LINE Channel Access Token

## 注意事項

- 前端和後端分離部署
- 資料儲存在 JSON 檔案中 (適合小型應用)
- Vercel 提供免費的 Serverless 函數支援
- 支援自動 HTTPS 和全球 CDN