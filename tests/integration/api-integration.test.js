const request = require('supertest');
const fs = require('fs');
const path = require('path');

// 整合測試 - 測試前後端完整交互
describe('API整合測試', () => {
  let app;
  const TEST_DATA_DIR = path.join(__dirname, 'integration-test-data');
  
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
        token: 'test-line-token-integration'
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

  describe('完整工作流程生命週期', () => {
    let workflowId;
    
    test('建立 -> 更新 -> 執行 -> 刪除 完整流程', async () => {
      // 1. 建立工作流程
      const createResponse = await request(app)
        .post('/api/workflows')
        .send({
          name: '整合測試流程',
          description: '用於整合測試的完整流程',
          nodes: [
            {
              id: 'http-1',
              type: 'default',
              data: {
                type: 'http-request',
                label: 'API呼叫',
                method: 'GET',
                url: 'http://localhost:3001/test/users/1'
              }
            },
            {
              id: 'notification-1',
              type: 'default',
              data: {
                type: 'notification',
                label: '成功通知',
                message: '找到用戶: {name}'
              }
            }
          ],
          edges: [
            {
              id: 'edge-1',
              source: 'http-1',
              target: 'notification-1',
              data: { active: true }
            }
          ]
        })
        .expect(200);
      
      workflowId = createResponse.body.workflowId;
      expect(workflowId).toBeDefined();
      expect(createResponse.body.name).toBe('整合測試流程');
      
      // 2. 執行工作流程
      const executeResponse = await request(app)
        .post(`/api/execute/${workflowId}`)
        .send({
          inputData: {}
        })
        .expect(200);
      
      expect(executeResponse.body.success).toBe(true);
      expect(executeResponse.body.results).toHaveLength(2);
      
      // 3. 刪除工作流程
      const deleteResponse = await request(app)
        .delete(`/api/workflows/${workflowId}`)
        .expect(200);
      
      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Token管理整合測試', () => {
    test('Token CRUD操作', async () => {
      // 1. 新增Token
      const createTokenResponse = await request(app)
        .post('/api/tokens')
        .send({
          key: 'integrationTestToken',
          name: '整合測試Token',
          token: 'integration-test-token-value'
        })
        .expect(200);
      
      expect(createTokenResponse.body.success).toBe(true);
      
      // 2. 取得Token列表
      const getTokensResponse = await request(app)
        .get('/api/tokens')
        .expect(200);
      
      expect(getTokensResponse.body.tokens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'integrationTestToken',
            name: '整合測試Token'
          })
        ])
      );
      
      // 3. 刪除Token
      const deleteTokenResponse = await request(app)
        .delete('/api/tokens/integrationTestToken')
        .expect(200);
      
      expect(deleteTokenResponse.body.success).toBe(true);
    });
  });
});