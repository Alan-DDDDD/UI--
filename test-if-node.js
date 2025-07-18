// 測試IF條件節點
const axios = require('axios');

async function testIfConditionNode() {
  console.log('🧪 測試IF條件節點...');
  
  // 創建一個簡單的測試流程
  const testWorkflow = {
    nodes: [
      {
        id: 'node-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: {
          type: 'if-condition',
          label: 'IF條件測試',
          conditions: [
            {
              field: '{message}',
              operator: 'contains',
              value: '你好'
            },
            {
              field: '{userId}',
              operator: '==',
              value: 'U123456'
            }
          ],
          logic: 'AND'
        }
      }
    ],
    edges: []
  };
  
  try {
    // 1. 創建測試流程
    console.log('📝 創建測試流程...');
    const createResponse = await axios.post('http://localhost:3001/api/workflows', {
      name: 'IF條件測試流程',
      description: '測試IF條件節點功能',
      ...testWorkflow
    });
    
    const workflowId = createResponse.data.workflowId;
    console.log(`✅ 流程創建成功: ${workflowId}`);
    
    // 2. 測試條件為真的情況
    console.log('\n🔍 測試條件為真 (AND邏輯)...');
    const trueTestResponse = await axios.post(`http://localhost:3001/api/execute/${workflowId}`, {
      inputData: {
        message: '你好，世界！',
        userId: 'U123456'
      }
    });
    
    console.log('結果:', trueTestResponse.data.results[0].result);
    console.log('條件結果應該為 true:', trueTestResponse.data.results[0].result.data);
    
    // 3. 測試條件為假的情況
    console.log('\n🔍 測試條件為假 (AND邏輯)...');
    const falseTestResponse = await axios.post(`http://localhost:3001/api/execute/${workflowId}`, {
      inputData: {
        message: '再見',
        userId: 'U123456'
      }
    });
    
    console.log('結果:', falseTestResponse.data.results[0].result);
    console.log('條件結果應該為 false:', falseTestResponse.data.results[0].result.data);
    
    // 4. 測試OR邏輯
    console.log('\n🔍 更新為OR邏輯並測試...');
    testWorkflow.nodes[0].data.logic = 'OR';
    
    await axios.put(`http://localhost:3001/api/workflows/${workflowId}`, {
      name: 'IF條件測試流程',
      description: '測試IF條件節點功能 (OR邏輯)',
      ...testWorkflow
    });
    
    const orTestResponse = await axios.post(`http://localhost:3001/api/execute/${workflowId}`, {
      inputData: {
        message: '再見',
        userId: 'U123456'
      }
    });
    
    console.log('結果:', orTestResponse.data.results[0].result);
    console.log('OR邏輯條件結果應該為 true:', orTestResponse.data.results[0].result.data);
    
    // 5. 清理測試流程
    console.log('\n🧹 清理測試流程...');
    await axios.delete(`http://localhost:3001/api/workflows/${workflowId}`);
    console.log('✅ 測試完成！');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.response?.data || error.message);
  }
}

// 執行測試
testIfConditionNode();