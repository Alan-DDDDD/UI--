# FlowBuilder 部署指南

## 🚀 快速部署

### 1. 安裝依賴
```bash
# 安裝所有依賴（前端+後端）
npm run install-all
```

### 2. 開發模式
```bash
# 同時啟動前後端
npm run dev
```

### 3. 生產模式
```bash
# 建置前端
npm run build

# 啟動後端
npm start
```

## 🌐 訪問地址
- 前端：http://localhost:3000
- 後端：http://localhost:3001
- LINE Webhook：http://localhost:3001/webhook/line/{workflowId}

## 📋 部署檢查清單
- [ ] Node.js 已安裝 (v16+)
- [ ] 依賴已安裝
- [ ] 端口 3000, 3001 可用
- [ ] LINE Bot Token 已設定
- [ ] 防火牆已開放端口

## 🔧 環境配置
複製 `.env.example` 為 `.env` 並修改配置：
```bash
cp .env.example .env
```

## 📱 LINE Bot 設定
1. 在 LINE Developers 建立 Bot
2. 取得 Channel Access Token
3. 在系統中新增 Token
4. 設定 Webhook URL

## 🐛 故障排除
- 檢查端口是否被占用
- 確認 Node.js 版本
- 檢查防火牆設定
- 查看控制台錯誤訊息