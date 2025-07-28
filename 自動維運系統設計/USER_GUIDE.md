# 自動維運 SaaS 服務使用指南

## 🚀 快速開始 (5分鐘設定)

### 1. 註冊和建立專案
```bash
# 訪問服務網站
https://autofix-service.com

# 註冊帳號 → 選擇方案 → 建立第一個專案
```

### 2. 安裝 CLI 工具
```bash
# 全域安裝
npm install -g autofix-cli

# 或使用 pip (Python 專案)
pip install autofix-cli

# 或使用 dotnet (C# 專案)
dotnet tool install -g autofix-cli
```

### 3. 初始化專案
```bash
# 在你的專案根目錄執行
autofix init

# 選擇專案類型
? 選擇專案類型: 
  ❯ React + Node.js
    Python + Django  
    C# + ASP.NET Core
    Java + Spring Boot
    Vue.js + Express
    Next.js Full-stack

# 輸入專案資訊
? 專案名稱: MyAwesomeApp
? GitHub 倉庫: https://github.com/username/my-app
? 部署平台: Vercel (前端) + Heroku (後端)
```

## 📋 自動生成的配置文件

### `.autofix.yml` (專案根目錄)
```yaml
# 自動生成，可手動調整
project:
  id: "proj_abc123"
  name: "MyAwesomeApp"
  type: "react-node"
  
service:
  api_url: "https://api.autofix-service.com"
  project_token: "your_secure_token"
  
monitoring:
  enabled: true
  sentry_integration: true
  
auto_fix:
  enabled: true
  approval_required: false  # 是否需要手動批准修正
  
notifications:
  email: "your@email.com"
  slack_webhook: "optional_slack_webhook"
```

## 🔧 整合到現有專案

### 前端整合 (自動完成)
```javascript
// 自動添加到 src/index.js 或 main.js
import { AutoFixMonitor } from '@autofix/monitor';

AutoFixMonitor.init({
  projectId: 'proj_abc123',
  apiKey: 'your_api_key',
  environment: process.env.NODE_ENV
});
```

### 後端整合 (自動完成)
```javascript
// 自動添加到 server.js 或 app.js
const { AutoFixSDK } = require('@autofix/sdk');

const autofix = new AutoFixSDK({
  projectId: 'proj_abc123',
  apiKey: process.env.AUTOFIX_API_KEY
});

// 錯誤處理中間件
app.use(autofix.errorHandler());
```

## 🎛️ Web 控制台功能

### 儀表板概覽
```
https://dashboard.autofix-service.com/projects/proj_abc123

📊 專案狀態
├── 🟢 系統健康度: 98.5%
├── 🔧 本月自動修正: 12 次
├── ⚡ 平均修正時間: 3.2 分鐘
└── 📈 錯誤趨勢: ↓ 15%

🚨 最近問題
├── CORS 錯誤 (已自動修正) - 2小時前
├── API 端點 404 (已自動修正) - 1天前
└── 建置失敗 (需要審核) - 3天前

🔄 部署歷史
├── v1.2.3 (成功) - 剛剛
├── v1.2.2 (回滾) - 2小時前
└── v1.2.1 (成功) - 1天前
```

## 📱 日常使用流程

### 自動化流程 (無需干預)
```
1. 用戶回報問題 或 系統自動偵測錯誤
   ↓
2. 系統自動分析日誌和錯誤
   ↓  
3. AI 生成修正方案
   ↓
4. 自動測試修正方案
   ↓
5. 自動部署到生產環境
   ↓
6. 發送通知確認修正完成
```

### 手動操作 (可選)
```bash
# 查看專案狀態
autofix status

# 手動觸發問題分析
autofix analyze --issue "CORS error on login"

# 查看修正建議 (不自動應用)
autofix suggest --error-type cors

# 手動部署
autofix deploy --environment production

# 查看修正歷史
autofix history --limit 10
```

## 💬 實際使用場景

### 場景 1: 用戶回報 CORS 錯誤
```
1. 用戶在 GitHub Issues 回報: "登入時出現 CORS 錯誤"
   
2. 系統自動:
   - 分析錯誤日誌
   - 識別為 CORS 配置問題
   - 生成修正程式碼
   - 建立 fix/cors-login-error 分支
   - 提交修正並測試
   - 合併到主分支並部署
   
3. 5分鐘後發送通知:
   📧 "CORS 錯誤已自動修正並部署完成"
```

### 場景 2: 部署失敗自動處理
```
1. GitHub Actions 部署失敗
   
2. 系統自動:
   - 分析建置日誌
   - 發現依賴版本衝突
   - 更新 package.json
   - 重新觸發部署
   
3. 部署成功後通知:
   📧 "依賴衝突已解決，部署成功"
```

## 📊 方案選擇

### 免費方案 (個人開發者)
```
✅ 1 個專案
✅ 每月 10 次自動修正
✅ 基礎錯誤監控
✅ Email 通知
❌ 進階 AI 修正
❌ 自定義插件
```

### 專業方案 ($29/月)
```
✅ 5 個專案
✅ 每月 100 次自動修正
✅ 進階錯誤分析
✅ Slack/Teams 整合
✅ 自定義修正規則
✅ 優先技術支援
```

### 企業方案 (聯絡報價)
```
✅ 無限專案
✅ 無限自動修正
✅ 私有部署選項
✅ 自定義插件開發
✅ 專屬客戶經理
✅ SLA 保證
```

## 🔔 通知設定

### Email 通知
```yaml
notifications:
  email:
    enabled: true
    events:
      - error_detected
      - fix_applied
      - deployment_completed
      - fix_failed
```

### Slack 整合
```yaml
notifications:
  slack:
    webhook_url: "https://hooks.slack.com/..."
    channel: "#alerts"
    events:
      - fix_applied
      - deployment_failed
```

## 🎯 最佳實踐建議

### 1. 初期設定
- 先開啟 `approval_required: true` 觀察修正品質
- 設定適當的通知頻率
- 定期檢查修正歷史

### 2. 進階使用
- 建立自定義修正規則
- 整合到 CI/CD 流程
- 設定不同環境的修正策略

### 3. 團隊協作
- 邀請團隊成員到專案
- 設定不同角色權限
- 建立修正審核流程

## 🚀 總結

使用這個 SaaS 服務就像：
1. **5分鐘設定** - 註冊 → 安裝 CLI → 初始化專案
2. **自動運行** - 系統自動監控和修正問題
3. **專注開發** - 你只需要專注寫新功能

**就是這麼簡單！** 🎉

## 📞 技術支援

### 文件資源
- 📖 [完整 API 文件](https://docs.autofix-service.com)
- 🎥 [影片教學](https://tutorials.autofix-service.com)
- 💬 [社群論壇](https://community.autofix-service.com)

### 聯絡方式
- 📧 Email: support@autofix-service.com
- 💬 即時聊天: 網站右下角聊天視窗
- 🐛 Bug 回報: [GitHub Issues](https://github.com/autofix-service/issues)

### 狀態頁面
- 🔍 服務狀態: [status.autofix-service.com](https://status.autofix-service.com)
- 📊 API 可用性: 99.9% SLA 保證

---

**文件版本**: v1.0  
**最後更新**: 2025/7/25  
**適用版本**: AutoFix CLI v2.0+