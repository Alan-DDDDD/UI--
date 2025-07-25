# 自動部署規則

## 🚀 快速部署指令

當用戶說「推送並部署」時，自動執行以下完整部署流程：

### 1. 後端部署 (Vercel)
```bash
# 檢查狀態並推送
git add .
git commit -m "deploy: update application"
git push
```

### 2. 前端部署 (GitHub Pages)
```bash
# GitHub Actions 會自動處理前端部署
# 無需額外操作，推送後自動觸發
echo "前端將由 GitHub Actions 自動部署"
```

### 3. 驗證部署
- 確認 Git 推送成功
- 確認 GitHub Pages 發布成功
- 提供部署完成的 URL

## 📋 執行順序
1. 先推送後端變更到 Git (觸發 Vercel 自動部署)
2. 再部署前端到 GitHub Pages
3. 回報部署狀態

## 🎯 觸發關鍵字
- "推送並部署"
- "部署"
- "deploy"

## 📝 部署訊息格式
使用統一的 commit 訊息格式：`deploy: update application`