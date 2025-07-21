# 🚀 Vercel 後端部署指南

## 快速部署步驟

### 1. 前往 Vercel
訪問 [vercel.com](https://vercel.com) 並登入

### 2. 導入專案
- 點擊 "New Project"
- 選擇 "Import Git Repository"
- 選擇你的 GitHub repository: `Alan-DDDDD/UI--`

### 3. 配置專案
- **Project Name**: `ui-flow-api`
- **Framework Preset**: Other
- **Root Directory**: `.` (根目錄)
- **Build Command**: 留空
- **Output Directory**: 留空
- **Install Command**: `npm install`

### 4. 環境變數 (可選)
- `NODE_ENV`: `production`

### 5. 部署
點擊 "Deploy" 開始部署

## 部署後驗證

部署完成後，你的 API 將可在以下網址訪問：
- `https://ui-flow-api.vercel.app/api/health`
- `https://ui-flow-api.vercel.app/api/workflows`

## 測試部署

```bash
# 在本地執行測試
node check-deployment.js
```

## 注意事項

- Vercel 會自動檢測 `vercel.json` 配置
- 每次推送到 GitHub 都會自動重新部署
- 免費版本有使用限制，適合開發和小型專案