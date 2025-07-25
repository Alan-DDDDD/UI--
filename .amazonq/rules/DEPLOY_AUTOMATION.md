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
- "推送並部署" (僅限 master 分支)
- "部署" (僅限 master 分支)
- "deploy" (僅限 master 分支)

### 🔍 分支檢查關鍵字
- "檢查當前分支"
- "確認部署分支"
- "我在哪個分支"

## 📝 部署訊息格式
使用統一的 commit 訊息格式：`deploy: update application`

## ⚠️ 分支部署注意事項

### 🚨 重要提醒
- **只有 master 分支會觸發自動部署**
- **dev_test 分支推送不會部署到生產環境**
- **不要在非 master 分支執行部署指令**

### 🔄 正確的開發部署流程

#### 開發分支 (dev_test) 完成後：
```bash
# 1. 提交開發代碼
git add .
git commit -m "feat: 新功能開發完成"

# 2. 切換到 master 分支
git checkout master

# 3. 合併開發分支
git merge dev_test

# 4. 執行部署 (觸發自動部署)
git add .
git commit -m "deploy: update application"
git push
```

#### 直接在 master 分支開發：
```bash
# 直接執行部署指令
git add .
git commit -m "deploy: update application"
git push
```

### 🛡️ 安全檢查
執行部署前請確認：
1. **當前分支是 master** - `git branch` 檢查
2. **代碼已測試完成** - 功能正常運作
3. **沒有未提交的變更** - `git status` 檢查

### 🚫 禁止操作
- 不要在 dev_test 分支執行「推送並部署」
- 不要修改 GitHub Actions 的分支觸發設定
- 不要跳過合併直接在 dev_test 推送