// 測試調試功能的簡單腳本
const axios = require('axios');

async function testDebugFeature() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    console.log('🧪 開始測試調試功能...');
    
    // 1. 創建一個簡單的測試流程
    const testWorkflow = {
      name: '調試測試流程',
      nodes: [
        {
          id: 'start-1',
          type: 'default',
          position: { x: 100, y: 100 },
          data: {
            type: 'notification',
            label: '開始節點',
            message: '流程開始執行'
          }
        },
        {
          id: 'http-1',
          type: 'default',
          position: { x: 300, y: 100 },
          data: {
            type: 'http-request',
            label: 'API測試',
            url: 'http://localhost:3001/test/users/1',
            method: 'GET'
          }
        },
        {
          id: 'end-1',
          type: 'default',
          position: { x: 500, y: 100 },
          data: {
            type: 'notification',
            label: '結束節點',
            message: '流程執行完成'
          }
        }
      ],
      edges: [
        {
          id: 'e1-2',
          source: 'start-1',
          target: 'http-1'
        },
        {
          id: 'e2-3',
          source: 'http-1',
          target: 'end-1'
        }
      ]
    };
    
    // 2. 創建工作流程
    const createResponse = await axios.post(`${baseUrl}/api/workflows`, testWorkflow);
    const workflowId = createResponse.data.workflowId;
    console.log(`✅ 創建測試流程成功: ${workflowId}`);
    
    // 3. 開始調試會話
    const debugResponse = await axios.post(`${baseUrl}/api/debug/start/${workflowId}`, {
      inputData: {},
      breakpoints: ['http-1'], // 在HTTP節點設置斷點
      stepMode: true
    });
    
    const sessionId = debugResponse.data.sessionId;
    console.log(`🐛 調試會話已啟動: ${sessionId}`);
    
    // 4. 單步執行
    console.log('⏭️ 執行第一步...');
    const step1 = await axios.post(`${baseUrl}/api/debug/step/${sessionId}`);
    console.log('步驟1結果:', step1.data);
    
    console.log('⏭️ 執行第二步...');
    const step2 = await axios.post(`${baseUrl}/api/debug/step/${sessionId}`);
    console.log('步驟2結果:', step2.data);
    
    // 5. 獲取執行狀態
    const status = await axios.get(`${baseUrl}/api/debug/status/${sessionId}`);
    console.log('📊 執行狀態:', status.data);
    
    // 6. 停止調試會話
    await axios.post(`${baseUrl}/api/debug/stop/${sessionId}`);
    console.log('⏹️ 調試會話已停止');
    
    console.log('🎉 調試功能測試完成！');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.response?.data || error.message);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  testDebugFeature();
}

module.exports = { testDebugFeature };