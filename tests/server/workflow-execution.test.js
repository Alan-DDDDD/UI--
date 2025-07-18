const request = require('supertest');
const fs = require('fs');
const path = require('path');

// 測試工作流程執行邏輯
describe('Workflow Execution Logic Tests', () => {
  let app;
  const TEST_DATA_DIR = path.join(__dirname, 'test-execution-data');
  
  beforeAll(() => {
    // 建立測試數據目錄
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
    
    // 初始化測試數據
    fs.writeFileSync(path.join(TEST_DATA_DIR, 'workflows.json'), JSON.stringify({}));
    fs.writeFileSync(path.join(TEST_DATA_DIR, 'metadata.json'), JSON.stringify({}));
    fs.writeFileSync(path.join(TEST_DATA_DIR, 'tokens.json'), JSON.stringify({
      testLineToken: {
        name: '測試LINE Token',
        token: 'test-line-token-123'
      }
    }));
    
    process.env.DATA_DIR = TEST_DATA_DIR;
    delete require.cache[require.resolve('../../server.js')];
    app = require('../../server.js');
  });
  
  afterAll(() => {
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });
  
  describe('HTTP Request Node', () => {
    let workflowId;
    
    beforeAll(async () => {
      const workflowData = {
        name: 'HTTP請求測試',
        nodes: [
          {
            id: 'http-1',
            type: 'default',
            data: {
              type: 'http-request',
              label: 'API呼叫',
              method: 'GET',
              url: 'http://localhost:3001/test/users/1',
              headers: { 'Content-Type': 'application/json' }
            }
          }
        ],
        edges: []
      };
      
      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);
      
      workflowId = response.body.workflowId;
    });
    
    test('執行HTTP GET請求', async () => {
      const response = await request(app)
        .post(`/api/execute/${workflowId}`)
        .send({ inputData: {} });
      
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].result.success).toBe(true);
      expect(response.body.results[0].result.data).toHaveProperty('name');
    });
  });
  
  describe('Condition Node', () => {
    let workflowId;
    
    beforeAll(async () => {
      const workflowData = {
        name: '條件判斷測試',
        nodes: [
          {
            id: 'condition-1',
            type: 'default',
            data: {
              type: 'condition',
              label: '條件判斷',
              field: '{testValue}',
              operator: '==',
              value: 'test'
            }
          }
        ],
        edges: []
      };
      
      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);
      
      workflowId = response.body.workflowId;
    });
    
    test('條件為真時返回true', async () => {
      const response = await request(app)
        .post(`/api/execute/${workflowId}`)
        .send({ inputData: { testValue: 'test' } });
      
      expect(response.body.success).toBe(true);
      expect(response.body.results[0].result.data).toBe(true);
    });
    
    test('條件為假時返回false', async () => {
      const response = await request(app)
        .post(`/api/execute/${workflowId}`)
        .send({ inputData: { testValue: 'other' } });
      
      expect(response.body.success).toBe(true);
      expect(response.body.results[0].result.data).toBe(false);
    });
  });
  
  describe('Notification Node', () => {
    let workflowId;
    
    beforeAll(async () => {
      const workflowData = {
        name: '通知測試',
        nodes: [
          {
            id: 'notification-1',
            type: 'default',
            data: {
              type: 'notification',
              label: '顯示訊息',
              message: '這是測試訊息'
            }
          }
        ],
        edges: []
      };
      
      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);
      
      workflowId = response.body.workflowId;
    });
    
    test('執行通知節點', async () => {
      const response = await request(app)
        .post(`/api/execute/${workflowId}`)
        .send({ inputData: {} });
      
      expect(response.body.success).toBe(true);
      expect(response.body.results[0].result.success).toBe(true);
      expect(response.body.results[0].result.data.type).toBe('notification');
      expect(response.body.results[0].result.data.message).toBe('這是測試訊息');
    });
  });
  
  describe('Data Mapping Node', () => {
    let workflowId;
    
    beforeAll(async () => {
      const workflowData = {
        name: '資料映射測試',
        nodes: [
          {
            id: 'http-1',
            type: 'default',
            data: {
              type: 'http-request',
              method: 'GET',
              url: 'http://localhost:3001/test/users/1'
            }
          },
          {
            id: 'mapping-1',
            type: 'default',
            data: {
              type: 'data-map',
              label: '資料映射',
              mappings: [
                { from: 'name', to: 'userName' },
                { from: 'email', to: 'userEmail' }
              ]
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'http-1',
            target: 'mapping-1',
            data: { active: true }
          }
        ]
      };
      
      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);
      
      workflowId = response.body.workflowId;
    });
    
    test('執行資料映射', async () => {
      const response = await request(app)
        .post(`/api/execute/${workflowId}`)
        .send({ inputData: {} });
      
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(2);
      
      const mappingResult = response.body.results[1];
      expect(mappingResult.result.success).toBe(true);
      expect(mappingResult.result.data).toHaveProperty('userName');
      expect(mappingResult.result.data).toHaveProperty('userEmail');
    });
  });
  
  describe('Complex Workflow', () => {
    let workflowId;
    
    beforeAll(async () => {
      const workflowData = {
        name: '複雜流程測試',
        nodes: [
          {
            id: 'http-1',
            type: 'default',
            data: {
              type: 'http-request',
              method: 'GET',
              url: 'http://localhost:3001/test/users/1'
            }
          },
          {
            id: 'condition-1',
            type: 'default',
            data: {
              type: 'condition',
              field: '{name}',
              operator: '==',
              value: 'Alice'
            }
          },
          {
            id: 'notification-success',
            type: 'default',
            data: {
              type: 'notification',
              message: '找到Alice用戶'
            }
          },
          {
            id: 'notification-fail',
            type: 'default',
            data: {
              type: 'notification',
              message: '未找到Alice用戶'
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'http-1',
            target: 'condition-1',
            data: { active: true }
          },
          {
            id: 'edge-2',
            source: 'condition-1',
            target: 'notification-success',
            data: { active: true }
          }
        ]
      };
      
      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);
      
      workflowId = response.body.workflowId;
    });
    
    test('執行複雜流程', async () => {
      const response = await request(app)
        .post(`/api/execute/${workflowId}`)
        .send({ inputData: {} });
      
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(1);
      
      // 檢查HTTP請求成功
      const httpResult = response.body.results.find(r => r.nodeId === 'http-1');
      expect(httpResult.result.success).toBe(true);
      
      // 檢查條件判斷
      const conditionResult = response.body.results.find(r => r.nodeId === 'condition-1');
      expect(conditionResult.result.success).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    let workflowId;
    
    beforeAll(async () => {
      const workflowData = {
        name: '錯誤處理測試',
        nodes: [
          {
            id: 'http-error',
            type: 'default',
            data: {
              type: 'http-request',
              method: 'GET',
              url: 'http://localhost:3001/nonexistent-endpoint'
            }
          }
        ],
        edges: []
      };
      
      const response = await request(app)
        .post('/api/workflows')
        .send(workflowData);
      
      workflowId = response.body.workflowId;
    });
    
    test('處理HTTP請求錯誤', async () => {
      const response = await request(app)
        .post(`/api/execute/${workflowId}`)
        .send({ inputData: {} });
      
      expect(response.body.success).toBe(false);
      expect(response.body.results[0].result.success).toBe(false);
      expect(response.body.results[0].result.error).toBeDefined();
    });
  });
});