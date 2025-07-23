# 🚀 FlowBuilder 部署指南

## 部署架構
- **前端**: GitHub Pages (https://alan-ddddd.github.io/UI--)
- **後端**: Vercel (https://ui-eight-alpha.vercel.app)

## ✅ 部署配置檢查

運行檢查腳本確認配置正確：
```bash
node deploy-check.js
```

## 🎯 前端部署 (GitHub Pages)

### 自動部署
1. 推送代碼到 `main` 分支
2. GitHub Actions 自動構建並部署
3. 約 2-5 分鐘後可訪問

### 手動觸發
在 GitHub repository 的 Actions 頁面手動觸發 workflow

## 🔧 後端部署 (Vercel)

### 首次部署
1. 前往 [vercel.com](https://vercel.com)
2. 點擊 "New Project"
3. 導入 GitHub repository
4. 配置設定：
   - **Project Name**: `ui-flow-api`
   - **Framework**: Other
   - **Root Directory**: `.` (根目錄)
   - **Build Command**: 留空
   - **Install Command**: `npm install`

### 自動部署
推送到 GitHub 後 Vercel 自動重新部署

## 🧪 部署驗證

### 前端測試
```bash
curl https://alan-ddddd.github.io/UI--/
```

### 後端測試
```bash
curl https://ui-eight-alpha.vercel.app/api/health
```

## 🔗 LINE Bot 設定

Webhook URL 格式：
```
https://ui-eight-alpha.vercel.app/webhook/line/{workflowId}
```

## ⚠️ 注意事項

1. **資料持久性**: Vercel 使用 `/tmp` 目錄，重啟後資料會遺失
2. **CORS 設定**: 已配置允許 GitHub Pages 域名
3. **環境變數**: 前端 API URL 已設定為 Vercel 域名
4. **HTTPS**: Vercel 自動提供 HTTPS 支援

## 🐛 常見問題

### 前端部署失敗
- 檢查 GitHub Actions 日誌
- 確認 `client/build` 目錄未被 gitignore

### 後端部署失敗
- 檢查 `vercel.json` 配置
- 確認 `api/index.js` 存在且語法正確

### API 連接失敗
- 檢查 CORS 設定
- 確認前端環境變數正確

## 📊 部署狀態監控

- GitHub Actions: 查看前端部署狀態
- Vercel Dashboard: 查看後端部署狀態和日誌
- 健康檢查: `/api/health` 端點監控後端狀態