// 測試IF-ELSE分支功能
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// 創建測試流程
async function createTestWorkflow() {
  const workflow = {
    name: 'IF-ELSE分支測試',
    nodes: [
      {
        id: 'start-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: {
          type: 'webhook-trigger',
          label: 'Webhook觸發',
          name: '開始'
        }
      },
      {
        id: 'condition-1',
        type: 'default',
        position: { x: 300, y: 100 },
        data: {
          type: 'if-condition',
          label: 'IF條件',
          conditions: [
            {
              field: '{message}',
              operator: 'contains',
              value: '你好'
            }
          ],
          logic: 'AND'
        }
      },
      {
        id: 'true-action',
        type: 'default',
        position: { x: 500, y: 50 },
        data: {
          type: 'notification',
          label: 'TRUE分支',
          message: '收到你好訊息！'
        }
      },
      {
        id: 'false-action',
        type: 'default',
        position: { x: 500, y: 150 },
        data: {
          type: 'notification',
          label: 'FALSE分支',
          message: '收到其他訊息'
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'start-1',
        target: 'condition-1',
        data: { active: true }
      },
      {
        id: 'e2-true',
        source: 'condition-1',
        target: 'true-action',
        data: { active: true, branch: 'true' },
        label: 'TRUE',
        style: { stroke: '#4CAF50' }
      },
      {
        id: 'e2-false',
        source: 'condition-1',
        target: 'false-action',
        data: { active: true, branch: 'false' },
        label: 'FALSE',
        style: { stroke: '#f44336' }
      }
    ]
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/api/workflows`, workflow);
    console.log('✅ 測試流程創建成功:', response.data.workflowId);
    return response.data.workflowId;
  } catch (error) {
    console.error('❌ 創建測試流程失敗:', error.message);
    return null;
  }
}

// 測試TRUE分支
async function testTrueBranch(workflowId) {
  console.log('\n🧪 測試TRUE分支...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/execute/${workflowId}`, {
      inputData: {
        message: '你好，世界！',
        userId: 'test-user-1'
      }
    });
    
    console.log('執行結果:', response.data.success ? '✅ 成功' : '❌ 失敗');
    console.log('執行的節點數:', response.data.executedNodes);
    
    // 檢查是否執行了正確的分支
    const executedNodeIds = response.data.results.map(r => r.nodeId);
    if (executedNodeIds.includes('true-action') && !executedNodeIds.includes('false-action')) {
      console.log('✅ TRUE分支執行正確');
    } else {
      console.log('❌ TRUE分支執行錯誤');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ TRUE分支測試失敗:', error.message);
    return null;
  }
}

// 測試FALSE分支
async function testFalseBranch(workflowId) {
  console.log('\n🧪 測試FALSE分支...');
  try {
    const response = await axios.post(`${API_BASE_URL}/api/execute/${workflowId}`, {
      inputData: {
        message: '其他訊息',
        userId: 'test-user-2'
      }
    });
    
    console.log('執行結果:', response.data.success ? '✅ 成功' : '❌ 失敗');
    console.log('執行的節點數:', response.data.executedNodes);
    
    // 檢查是否執行了正確的分支
    const executedNodeIds = response.data.results.map(r => r.nodeId);
    if (executedNodeIds.includes('false-action') && !executedNodeIds.includes('true-action')) {
      console.log('✅ FALSE分支執行正確');
    } else {
      console.log('❌ FALSE分支執行錯誤');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ FALSE分支測試失敗:', error.message);
    return null;
  }
}

// 主測試函數
async function runTests() {
  console.log('🚀 開始IF-ELSE分支測試...\n');
  
  // 創建測試流程
  const workflowId = await createTestWorkflow();
  if (!workflowId) {
    console.log('❌ 無法創建測試流程，測試終止');
    return;
  }
  
  // 等待一秒讓流程保存完成
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 測試TRUE分支
  const trueResult = await testTrueBranch(workflowId);
  
  // 測試FALSE分支
  const falseResult = await testFalseBranch(workflowId);
  
  // 總結
  console.log('\n📊 測試總結:');
  console.log('TRUE分支:', trueResult ? '✅ 通過' : '❌ 失敗');
  console.log('FALSE分支:', falseResult ? '✅ 通過' : '❌ 失敗');
  
  if (trueResult && falseResult) {
    console.log('🎉 IF-ELSE分支功能測試全部通過！');
  } else {
    console.log('⚠️ 部分測試失敗，請檢查實現');
  }
  
  console.log(`\n💡 測試流程ID: ${workflowId}`);
  console.log('可以在前端界面中查看和編輯此流程');
}

// 執行測試
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { createTestWorkflow, testTrueBranch, testFalseBranch };