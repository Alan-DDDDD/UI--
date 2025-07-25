# 部署架構選項分析

## 背景說明
專案從使用 `server.js` 改為 `api/index.js` 是為了適配 Vercel serverless 部署需求。

## 選項 1：雙重架構
**本地開發用 server.js，生產部署用 api/index.js**

### 優點
- 本地開發體驗完整（調試、熱重載、完整功能）
- 生產環境符合 Vercel serverless 最佳實踐
- 可以針對不同環境優化

### 缺點
- **維護成本高** - 需要同步兩套代碼
- **功能不一致** - 容易出現本地能用但線上不能用的問題
- **測試複雜** - 需要分別測試兩個環境
- **部署風險** - 功能差異可能導致生產問題

### 實施方式
```json
// vercel.json
{
  "version": 2,
  "functions": {
    "api/index.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

```json
// package.json 添加腳本
{
  "scripts": {
    "dev": "node server.js",
    "build": "echo 'Using api/index.js for production'",
    "start": "node server.js"
  }
}
```

---

## 選項 2：統一使用 server.js ⭐ 推薦
**修改配置讓 Vercel 直接使用 server.js**

### 優點
- **代碼統一** - 只需維護一套代碼
- **功能完整** - 所有功能都可用（調試、LINE Bot、資料持久化）
- **開發簡單** - 本地和線上行為一致
- **快速部署** - 無需重寫現有功能

### 缺點
- **不符合 serverless 最佳實踐** - Express 應用在 serverless 環境效能較差
- **冷啟動慢** - 每次請求都要初始化整個 Express 應用
- **資源浪費** - serverless 不適合長時間運行的應用架構
- **擴展性差** - 無法充分利用 Vercel 的 serverless 優勢

### 實施方式
```json
// vercel.json
{
  "version": 2,
  "functions": {
    "server.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    { "src": "/(.*)", "dest": "/server.js" }
  ]
}
```

```json
// package.json 修改
{
  "type": "commonjs",
  "main": "server.js",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js"
  }
}
```

---

## 選項 3：完善 api/index.js
**將 server.js 功能遷移到 serverless 架構**

### 優點
- **性能最佳** - 充分利用 serverless 優勢
- **擴展性好** - 自動擴縮容，按需付費
- **符合現代架構** - 微服務、無狀態設計
- **維護成本低** - 單一代碼庫

### 缺點
- **重構工作量大** - 需要重寫大部分邏輯
- **架構複雜** - 需要重新設計資料存儲和狀態管理
- **調試困難** - serverless 環境調試不如本地方便
- **功能限制** - 某些功能（如調試會話）需要重新設計

### 實施方式
```json
// vercel.json
{
  "version": 2,
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

需要創建的檔案結構：
```
api/
├── index.js          # 主路由處理
├── workflows.js      # 工作流程相關 API
├── tokens.js         # Token 管理 API
├── execute.js        # 執行相關 API
└── webhook.js        # Webhook 處理
```

---

## 推薦方案：選項 2

### 理由
1. **現有功能完整** - server.js 已經實現了所有核心功能
2. **快速上線** - 只需修改配置即可部署
3. **風險最低** - 不需要重寫代碼，減少 bug 風險
4. **開發效率** - 本地和線上環境一致

### 後續優化路徑
1. 等功能穩定後，再考慮逐步遷移到 serverless 架構
2. 可以先將部分獨立功能（如健康檢查）拆分為獨立的 serverless functions
3. 使用外部資料庫替代檔案存儲
4. 實施無狀態設計模式

---

## 切換指南

### 從選項 1 切換到選項 2
1. 修改 `vercel.json` 配置
2. 更新 `package.json` 的 type 為 commonjs
3. 重新部署

### 從選項 2 切換到選項 3
1. 創建 `api/` 目錄結構
2. 將 `server.js` 功能拆分到各個 API 檔案
3. 重新設計資料存儲方案
4. 更新 `vercel.json` 配置

### 從選項 3 回到選項 2
1. 恢復 `server.js` 檔案
2. 修改 `vercel.json` 配置
3. 更新 `package.json`

---

## 注意事項

- **資料持久化**：Vercel serverless 環境不支援檔案系統持久化，需要使用外部資料庫
- **環境變數**：確保在 Vercel 控制台設定必要的環境變數
- **冷啟動**：serverless 函數有冷啟動時間，首次請求可能較慢
- **執行時間限制**：Vercel 免費版有 10 秒執行時間限制
- **記憶體限制**：注意 serverless 函數的記憶體使用限制

---

*最後更新：2024年12月*