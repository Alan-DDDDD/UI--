const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// 模擬數據目錄
const TEST_DATA_DIR = path.join(__dirname, 'test-data');
const TEST_WORKFLOWS_FILE = path.join(TEST_DATA_DIR, 'workflows.json');
const TEST_METADATA_FILE = path.join(TEST_DATA_DIR, 'metadata.json');
const TEST_TOKENS_FILE = path.join(TEST_DATA_DIR, 'tokens.json');

// 建立測試用的server實例
let app;
let server;

beforeAll(() => {
  // 建立測試數據目錄
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  
  // 初始化測試數據
  fs.writeFileSync(TEST_WORKFLOWS_FILE, JSON.stringify({}));
  fs.writeFileSync(TEST_METADATA_FILE, JSON.stringify({}));
  fs.writeFileSync(TEST_TOKENS_FILE, JSON.stringify({}));
  
  // 設置環境變數指向測試數據
  process.env.DATA_DIR = TEST_DATA_DIR;
  
  // 動態載入server
  delete require.cache[require.resolve('../../server.js')];
  app = require('../../server.js');
});

afterAll(() => {
  // 清理測試數據
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  if (server) {
    server.close();
  }
});

describe('FlowBuilder Server API Tests', () => {
  
  describe('Workflow Management', () => {
    let workflowId;
    
    test('POST /api/workflows - 建立新流程', async () => {
      const workflowData = {
        name: '測試流程',
        description: '這是一個測試流程',
        nodes: [
          {
            id: 'node-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: { type: 'http-request', label: 'API呼叫', url: 'https://api.example.com' }
          }
        ],
        edges: [],
        inputParams: [{ name: 'userId', type: 'string', required: true }],
        outputParams: [{ name: 'result', type: 'object' }]
      };
      
      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData)
        .expect(200);
      
      expect(response.body).toHaveProperty('workflowId');
      expect(response.body.name).toBe('測試流程');
      workflowId = response.body.workflowId;
    });
    
    test('GET /api/workflows - 取得流程列表', async () => {
      const response = await request(app)
        .get('/api/workflows')
        .expect(200);
      
      expect(response.body).toHaveProperty('workflows');
      expect(Array.isArray(response.body.workflows)).toBe(true);
      expect(response.body.workflows.length).toBeGreaterThan(0);
    });
    
    test('GET /api/workflows/:id - 取得特定流程', async () => {
      const response = await request(app)
        .get(`/api/workflows/${workflowId}`)
        .expect(200);
      
      expect(response.body.nodes).toBeDefined();
      expect(response.body.edges).toBeDefined();
    });
    
    test('PUT /api/workflows/:id - 更新流程', async () => {
      const updatedData = {
        name: '更新的測試流程',
        nodes: [
          {
            id: 'node-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: { type: 'http-request', label: 'API呼叫', url: 'https://api.updated.com' }
          }
        ],
        edges: []
      };
      
      const response = await request(app)
        .put(`/api/workflows/${workflowId}`)
        .send(updatedData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.name).toBe('更新的測試流程');
    });
    
    test('DELETE /api/workflows/:id - 刪除流程', async () => {
      const response = await request(app)
        .delete(`/api/workflows/${workflowId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Token Management', () => {
    test('POST /api/tokens - 新增Token', async () => {
      const tokenData = {
        key: 'testToken',
        name: '測試Token',
        token: 'test-token-value-123'
      };
      
      const response = await request(app)
        .post('/api/tokens')
        .send(tokenData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
    
    test('GET /api/tokens - 取得Token列表', async () => {
      const response = await request(app)
        .get('/api/tokens')
        .expect(200);
      
      expect(response.body).toHaveProperty('tokens');
      expect(Array.isArray(response.body.tokens)).toBe(true);
    });
    
    test('DELETE /api/tokens/:key - 刪除Token', async () => {
      const response = await request(app)
        .delete('/api/tokens/testToken')
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Workflow Execution', () => {
    let testWorkflowId;
    
    beforeAll(async () => {
      // 建立測試用流程
      const workflowData = {
        name: '執行測試流程',
        nodes: [
          {
            id: 'notification-1',
            type: 'default',
            data: { type: 'notification', message: '測試訊息' }
          }
        ],
        edges: []
      };
      
      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);
      
      testWorkflowId = response.body.workflowId;
    });
    
    test('POST /api/execute/:id - 執行流程', async () => {
      const response = await request(app)
        .post(`/api/execute/${testWorkflowId}`)
        .send({ inputData: { testParam: 'testValue' } })
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });
  
  describe('Test API Endpoints', () => {
    test('GET /test/users/:id - 取得測試用戶', async () => {
      const response = await request(app)
        .get('/test/users/1')
        .expect(200);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });
    
    test('GET /test/orders/:userId - 取得測試訂單', async () => {
      const response = await request(app)
        .get('/test/orders/1')
        .expect(200);
      
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('orders');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });
    
    test('POST /test/notifications - 發送測試通知', async () => {
      const notificationData = {
        message: '測試通知',
        recipient: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/test/notifications')
        .send(notificationData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('Debug API', () => {
    let testWorkflowId;
    let debugSessionId;
    
    beforeAll(async () => {
      // 建立測試用流程
      const workflowData = {
        name: '調試測試流程',
        nodes: [
          {
            id: 'debug-node-1',
            type: 'default',
            data: { type: 'notification', message: '調試測試' }
          }
        ],
        edges: []
      };
      
      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);
      
      testWorkflowId = response.body.workflowId;
    });
    
    test('POST /api/debug/start/:workflowId - 開始調試會話', async () => {
      const response = await request(app)
        .post(`/api/debug/start/${testWorkflowId}`)
        .send({
          inputData: {},
          breakpoints: [],
          stepMode: true
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.status).toBe('ready');
      debugSessionId = response.body.sessionId;
    });
    
    test('POST /api/debug/step/:sessionId - 單步執行', async () => {
      const response = await request(app)
        .post(`/api/debug/step/${debugSessionId}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
    });
    
    test('POST /api/debug/stop/:sessionId - 停止調試', async () => {
      const response = await request(app)
        .post(`/api/debug/stop/${debugSessionId}`)
        .expect(200);
      
      expect(response.body.status).toBe('stopped');
    });
  });
  
  describe('Error Handling', () => {
    test('GET /api/workflows/nonexistent - 不存在的流程', async () => {
      await request(app)
        .get('/api/workflows/nonexistent')
        .expect(404);
    });
    
    test('POST /api/tokens - 缺少必要參數', async () => {
      await request(app)
        .post('/api/tokens')
        .send({ key: 'test' }) // 缺少token
        .expect(400);
    });
    
    test('POST /api/execute/nonexistent - 執行不存在的流程', async () => {
      await request(app)
        .post('/api/execute/nonexistent')
        .send({ inputData: {} })
        .expect(404);
    });
  });
});