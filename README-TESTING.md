# FlowBuilder 測試指南

本文檔說明如何執行 FlowBuilder 系統的各種測試。

## 📋 測試架構

FlowBuilder 採用多層次測試策略：

### 🧪 測試類型

1. **單元測試 (Unit Tests)**
   - 後端 API 功能測試
   - 前端組件測試
   - 工作流程執行邏輯測試

2. **整合測試 (Integration Tests)**
   - API 端點整合測試
   - 前後端交互測試
   - 資料庫操作測試

3. **端到端測試 (E2E Tests)**
   - 完整用戶流程測試
   - 瀏覽器自動化測試
   - 工作流程建立和執行測試

4. **性能測試 (Performance Tests)**
   - 大量節點處理測試
   - 並發執行測試
   - 記憶體使用測試

## 🚀 快速開始

### 安裝測試依賴

```bash
# 安裝後端測試依賴
npm install

# 安裝前端測試依賴
cd client && npm install
```

### 執行所有測試

```bash
# 使用測試執行器（推薦）
node test-runner.js

# 或使用 npm 腳本
npm test
```

## 📝 詳細測試指令

### 後端測試

```bash
# 執行所有後端測試
npm run test:server

# 執行特定測試文件
npx jest tests/server/server.test.js

# 執行工作流程執行測試
npx jest tests/server/workflow-execution.test.js

# 監視模式（開發時使用）
npx jest tests/server --watch
```

### 前端測試

```bash
# 執行所有前端測試
npm run test:client

# 或進入 client 目錄
cd client
npm test

# 執行特定組件測試
npm test -- --testNamePattern="NodeEditor"

# 生成覆蓋率報告
npm run test:coverage
```

### 整合測試

```bash
# 執行整合測試
npx jest tests/integration

# 執行特定整合測試
npx jest tests/integration/api-integration.test.js
```

### E2E 測試

```bash
# 執行 E2E 測試（需要先啟動系統）
npm run test:e2e

# 開啟 Cypress 測試介面
npm run test:e2e:open

# 執行特定 E2E 測試
npx cypress run --spec "tests/e2e/specs/workflow-creation.cy.js"
```

## 🔧 測試配置

### Jest 配置 (jest.config.js)

```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'server.js',
    '!tests/**',
    '!node_modules/**'
  ],
  coverageDirectory: 'coverage',
  testTimeout: 30000
};
```

### Cypress 配置 (tests/e2e/cypress.config.js)

```javascript
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'tests/e2e/support/e2e.js',
    specPattern: 'tests/e2e/specs/**/*.cy.js'
  }
});
```

## 📊 測試覆蓋率

### 生成覆蓋率報告

```bash
# 生成完整覆蓋率報告
npm run test:coverage

# 查看覆蓋率報告
open coverage/lcov-report/index.html
```

### 覆蓋率目標

- **語句覆蓋率**: > 80%
- **分支覆蓋率**: > 75%
- **函數覆蓋率**: > 85%
- **行覆蓋率**: > 80%

## 🧩 測試結構

```
tests/
├── server/                 # 後端測試
│   ├── server.test.js      # API 端點測試
│   └── workflow-execution.test.js  # 工作流程執行測試
├── client/                 # 前端測試（在 client/src/ 中）
├── integration/            # 整合測試
│   └── api-integration.test.js
├── e2e/                    # E2E 測試
│   ├── specs/              # 測試規格
│   ├── support/            # 支援文件
│   └── fixtures/           # 測試數據
└── setup.js               # 測試設置
```

## 🔍 測試最佳實踐

### 1. 測試命名

```javascript
describe('工作流程管理', () => {
  test('應該能建立新的工作流程', () => {
    // 測試實現
  });
  
  test('應該能更新現有工作流程', () => {
    // 測試實現
  });
});
```

### 2. 測試數據管理

```javascript
beforeEach(() => {
  // 設置測試數據
  setupTestData();
});

afterEach(() => {
  // 清理測試數據
  cleanupTestData();
});
```

### 3. 模擬外部依賴

```javascript
// 模擬 HTTP 請求
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

// 模擬 LINE API
const mockLineAPI = {
  reply: jest.fn().mockResolvedValue({ status: 200 }),
  push: jest.fn().mockResolvedValue({ status: 200 })
};
```

## 🐛 調試測試

### 1. 執行單一測試

```bash
# 執行特定測試文件
npx jest tests/server/server.test.js

# 執行特定測試案例
npx jest --testNamePattern="應該能建立新的工作流程"
```

### 2. 詳細輸出

```bash
# 顯示詳細測試結果
npx jest --verbose

# 顯示測試覆蓋率
npx jest --coverage
```

### 3. 調試模式

```bash
# Node.js 調試模式
node --inspect-brk node_modules/.bin/jest tests/server/server.test.js

# 使用 Chrome DevTools 調試
```

## 📈 持續整合

### GitHub Actions 配置

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 🚨 常見問題

### 1. 測試超時

```javascript
// 增加測試超時時間
jest.setTimeout(30000);

// 或在特定測試中
test('長時間執行的測試', async () => {
  // 測試實現
}, 30000);
```

### 2. 異步測試

```javascript
// 使用 async/await
test('異步操作測試', async () => {
  const result = await someAsyncFunction();
  expect(result).toBe(expectedValue);
});

// 使用 Promise
test('Promise 測試', () => {
  return somePromiseFunction().then(result => {
    expect(result).toBe(expectedValue);
  });
});
```

### 3. 模擬清理

```javascript
afterEach(() => {
  // 清理所有模擬
  jest.clearAllMocks();
  
  // 重置模擬狀態
  jest.resetAllMocks();
});
```

## 📚 測試工具

### 使用的測試框架和工具

- **Jest**: JavaScript 測試框架
- **Supertest**: HTTP 斷言庫
- **React Testing Library**: React 組件測試
- **Cypress**: E2E 測試框架
- **@testing-library/jest-dom**: DOM 測試工具

### 自定義測試工具

```javascript
// 自定義匹配器
expect.extend({
  toBeValidWorkflow(received) {
    const pass = received.nodes && received.edges;
    return {
      message: () => `expected ${received} to be a valid workflow`,
      pass
    };
  }
});
```

## 🎯 測試策略

### 1. 測試金字塔

```
    E2E Tests (少量)
   ↗              ↖
Integration Tests (中等)
↗                      ↖
Unit Tests (大量)
```

### 2. 測試優先級

1. **高優先級**: 核心業務邏輯、API 端點
2. **中優先級**: UI 組件、工作流程執行
3. **低優先級**: 工具函數、樣式測試

### 3. 測試覆蓋範圍

- ✅ 工作流程 CRUD 操作
- ✅ 節點執行邏輯
- ✅ 條件判斷和分支
- ✅ LINE Bot 整合
- ✅ Token 管理
- ✅ 調試功能
- ✅ 錯誤處理
- ✅ Webhook 觸發

## 📞 支援

如果在測試過程中遇到問題：

1. 檢查 [常見問題](#-常見問題) 部分
2. 查看測試日誌和錯誤訊息
3. 確認測試環境配置正確
4. 檢查依賴版本是否相容

---

**記住**: 好的測試是系統品質的保證！🧪✨