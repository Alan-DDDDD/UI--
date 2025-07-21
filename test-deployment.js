// 部署測試腳本
const axios = require('axios');

const API_URL = 'https://ui-eight-alpha.vercel.app';

async function testDeployment() {
  console.log('🧪 測試 Vercel 部署...');
  
  try {
    // 測試基本 API
    const response = await axios.get(`${API_URL}/api/workflows`);
    console.log('✅ API 連接成功');
    console.log('📊 工作流程數量:', response.data.length);
    
    // 測試健康檢查
    const healthCheck = await axios.get(`${API_URL}/api/health`);
    console.log('✅ 健康檢查通過');
    
  } catch (error) {
    console.error('❌ 部署測試失敗:', error.message);
    if (error.response) {
      console.error('狀態碼:', error.response.status);
      console.error('錯誤詳情:', error.response.data);
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  testDeployment();
}

module.exports = testDeployment;