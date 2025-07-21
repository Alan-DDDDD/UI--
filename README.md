# FlowBuilder

一個功能完整的視覺化流程編輯器，支援拖放節點設計、API串接、LINE Bot整合和自動化工作流程執行。

## ✨ 功能特色

### 🎨 核心功能
- **視覺化流程編輯器** - 基於ReactFlow的直觀拖放介面
- **多種節點類型** - HTTP請求、條件判斷、資料轉換、LINE Bot等
- **智能執行引擎** - 支援條件分支、錯誤處理和結果追蹤
- **參數化設計** - 輸入/輸出參數定義和映射
- **子流程支援** - 流程組合和重用

### 📱 LINE Bot 整合
- **完整API支援** - Reply、Push、Carousel模板
- **Webhook觸發** - 自動響應LINE事件
- **Token管理** - 安全的API金鑰儲存
- **模板設計** - 豐富的訊息格式支援

### ⚡ 進階功能
- **執行結果視窗** - 逐步顯示執行狀態和錯誤詳情
- **參數輸入對話框** - 執行時動態輸入資料
- **🐛 逐步執行調試** - 單步執行、斷點設置、變數檢視
- **智能提示系統** - 實時流程分析和建議
- **快速操作工具** - 鍵盤快捷鍵支援
- **Token安全管理** - 加密儲存和引用

## 🚀 快速開始

### 線上體驗
- **前端應用**: https://alan-ddddd.github.io/UI--
- **後端API**: https://ui-eight-alpha.vercel.app
- **Webhook**: https://ui-eight-alpha.vercel.app/webhook/line/{workflowId}

### 本地開發

#### 1. 環境準備
```bash
# 安裝所有依賴
npm run install-all
```

#### 2. 啟動系統
```bash
# 開發模式（同時啟動前後端）
npm run dev

# 或分別啟動
npm start          # 後端 (port 3001)
cd client && npm start  # 前端 (port 3000)
```

#### 3. 本地訪問
- 前端介面：http://localhost:3000
- 後端API：http://localhost:3001
- Webhook端點：http://localhost:3001/webhook/line/{workflowId}

## 📖 使用指南

### 基本操作
1. **建立流程**：點擊「新增流程」開始設計
2. **添加節點**：從左側面板拖拽節點到畫布
3. **連接節點**：拖拽節點間的連接點建立流程
4. **配置節點**：點擊節點進行詳細設定
5. **儲存流程**：使用快捷鍵 Ctrl+S 或點擊儲存按鈕
6. **執行測試**：使用快捷鍵 Ctrl+R 或點擊執行按鈕
7. **調試流程**：點擊「🐛 開始調試」進行逐步執行

### 節點類型說明

#### 🌐 HTTP請求節點
- 支援 GET/POST/PUT/DELETE 方法
- 自定義Headers和Body
- 變數替換支援 `{變數名}` 語法
- 自動錯誤處理和重試

#### 🔀 條件判斷節點
- 多種比較運算子（等於、包含、大於等）
- 支援數值和字串比較
- 動態欄位引用
- 條件分支執行

#### 📱 LINE Bot節點
- **LINE回覆**：回應用戶訊息
- **LINE推送**：主動發送訊息
- **LINE多頁**：Carousel/Buttons/Confirm模板
- 自動Token替換和錯誤處理

#### 🔄 資料處理節點
- **資料映射**：欄位對應和轉換
- **顯示訊息**：系統通知和日誌
- **Webhook觸發**：外部事件接收
- **子流程呼叫**：流程組合和重用

### 進階功能

#### 🔑 Token管理
```javascript
// 在節點中引用Token
{
  "Authorization": "Bearer {lineToken}",
  "Content-Type": "application/json"
}
```

#### 📊 參數映射
```javascript
// 變數替換語法
{
  "to": "{userId}",
  "message": "Hello {userName}!"
}
```

#### 🎯 執行結果
- 詳細的步驟執行狀態
- 錯誤訊息和除錯資訊
- 成功/失敗統計
- JSON格式的結果資料

#### 🐛 逐步執行調試
- **單步執行**：一次執行一個節點
- **斷點設置**：在節點上右鍵設置斷點
- **變數檢視**：實時查看流程變數和上下文
- **執行控制**：暫停、繼續、停止執行
- **節點高亮**：當前執行節點金色高亮顯示

#### 🐛 逐步執行調試
- **單步執行**：一次執行一個節點
- **斷點設置**：在節點上右鍵設置斷點
- **變數檢視**：實時查看流程變數和上下文
- **執行控制**：暫停、繼續、停止執行
- **節點高亮**：當前執行節點金色高亮顯示

## 🛠️ 開發指南

### 專案結構
```
FlowBuilder/
├── server.js              # 後端主程式
├── client/                # 前端React應用
│   ├── src/
│   │   ├── App.js         # 主應用組件
│   │   ├── NodePanel.js   # 節點面板
│   │   ├── NodeEditor.js  # 節點編輯器
│   │   ├── ExecutionResults.js  # 執行結果視窗
│   │   ├── ExecuteDialog.js     # 參數輸入對話框
│   │   └── ...
├── data/                  # 資料儲存
│   ├── workflows.json     # 工作流程資料
│   ├── metadata.json      # 流程元資料
│   └── tokens.json        # API Token
└── README.md
```

### API端點
- `GET /api/workflows` - 取得流程列表
- `POST /api/workflows` - 建立新流程
- `PUT /api/workflows/:id` - 更新流程
- `POST /api/execute/:id` - 執行流程
- `POST /webhook/line/:id` - LINE Webhook

### 自定義節點
```javascript
// 在 executeNode 函數中添加新節點類型
case 'custom-node':
  // 自定義邏輯
  return { success: true, data: result };
```

## 🔧 配置說明

### 環境變數
```bash
PORT=3001                    # 後端端口
REACT_APP_API_URL=http://localhost:3001  # API地址
```

### LINE Bot設定
1. 在LINE Developers建立Bot
2. 取得Channel Access Token
3. 在Token管理中添加Token
4. 設定Webhook URL：`http://your-domain/webhook/line/{workflowId}`

## 📝 更新日誌

### v2.0.0 (最新)
- ✅ 新增執行結果視窗
- ✅ 新增參數輸入對話框
- ✅ 修復LINE回覆錯誤處理
- ✅ 改進UI設計和用戶體驗
- ✅ 完善錯誤顯示和除錯功能

### v1.0.0
- ✅ 基礎流程編輯功能
- ✅ LINE Bot完整支援
- ✅ Token管理系統
- ✅ 智能提示和快速操作

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

## 🆘 支援

- 📖 [使用說明書](# "點擊應用內的📖按鈕查看完整說明")
- 🐛 [問題回報](https://github.com/your-repo/issues)
- 💬 [討論區](https://github.com/your-repo/discussions)

---

**FlowBuilder** - 讓流程自動化變得簡單而強大 🚀