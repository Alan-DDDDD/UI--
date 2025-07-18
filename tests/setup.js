// Jest 測試設置文件

// 設置測試環境變數
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // 使用不同的端口避免衝突

// 全域測試設置
beforeAll(() => {
  // 設置測試超時
  jest.setTimeout(30000);
});

// 每個測試後清理
afterEach(() => {
  // 清理模擬
  jest.clearAllMocks();
});

// 全域測試清理
afterAll(() => {
  // 清理資源
});