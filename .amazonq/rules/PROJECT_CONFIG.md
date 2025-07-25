# FlowBuilder 專案配置文件

## 🚀 當前部署狀況

### 前端部署
- **平台**: GitHub Pages
- **URL**: https://alan-ddddd.github.io/UI--
- **倉庫**: alan-ddddd/UI--
- **分支**: gh-pages (自動部署)
- **建置工具**: React Scripts + gh-pages

### 後端部署  
- **平台**: Vercel
- **URL**: https://ui-coral-eta-48.vercel.app
- **專案名稱**: ui-coral-eta-48
- **部署方式**: Git 自動部署 (推薦)

## 📁 專案結構

```
FlowBuilder/
├── client/                 # React 前端
│   ├── src/
│   │   ├── config.js      # API 配置
│   │   └── ...
│   ├── package.json       # 前端依賴
│   └── build/            # 建置輸出
├── server.js             # Node.js 後端
├── package.json          # 後端依賴
├── data/                 # 資料儲存
│   ├── workflows.json
│   ├── metadata.json
│   └── tokens.json
└── PROJECT_CONFIG.md     # 本文件
```

## ⚙️ 重要配置

### 前端配置 (client/src/config.js)
```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 
    'http://localhost:3001' : 
    'https://ui-coral-eta-48.vercel.app'
  );
```

### 前端 package.json 關鍵設定
```json
{
  "homepage": "https://alan-ddddd.github.io/UI--",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### 後端 CORS 配置 (server.js)
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://alan-ddddd.github.io',
    'https://ui-coral-eta-48.vercel.app'
  ],
  credentials: true
}));
```

## 🔧 部署指令

### 前端部署
```bash
cd client
npm run build
npm run deploy
```

### 後端部署
```bash
# 推送到 Git 觸發自動部署 (推薦)
git add .
git commit -m "update backend"
git push

# 或使用 Vercel CLI (需要先登入)
vercel --prod --yes
```

## 🌐 API 端點

### 主要 API
- `GET /api/workflows` - 取得流程列表
- `POST /api/workflows` - 建立新流程
- `PUT /api/workflows/:id` - 更新流程
- `POST /api/execute/:id` - 執行流程
- `GET /api/tokens` - 取得 Token 列表
- `POST /api/tokens` - 新增 Token

### Webhook 端點
- `POST /webhook/line/:workflowId` - LINE Bot Webhook

## 🚨 修改注意事項

### ❌ 禁止隨意修改的設定
1. **API_BASE_URL** - 除非後端 URL 真的改變
2. **CORS origin** - 必須包含正確的前端域名
3. **homepage** - 必須對應 GitHub Pages URL
4. **package.json scripts** - 部署相關腳本

### ✅ 安全修改原則
1. **修改前先確認當前配置** - 檢查本文件
2. **一次只改一個設定** - 避免多處同時修改
3. **測試後再部署** - 本地測試通過後再部署
4. **記錄變更** - 更新本文件

## 🔍 故障排除

### CORS 錯誤
- 檢查後端 CORS 配置是否包含前端域名
- 確認前端 API_BASE_URL 指向正確後端

### 404 錯誤
- 檢查前端 homepage 設定
- 確認 GitHub Pages 部署成功
- 檢查後端 API 端點是否存在

### 部署失敗
- 檢查 package.json 腳本設定
- 確認 GitHub Pages 和 Vercel 權限
- 查看部署日誌錯誤訊息

## 📝 更新記錄

- 2024/12/19: 初始配置文件建立
- 2025/07/25: 更新後端部署 URL
- 前端: GitHub Pages (alan-ddddd.github.io/UI--)
- 後端: Vercel (ui-coral-eta-48.vercel.app)
- CORS 配置已修正

---

**重要提醒**: 修改任何配置前請先參考此文件，避免破壞現有部署！