// 重試機制範例 - 可整合到您的 executeNode 函數中

async function executeHttpWithRetry(axiosConfig, retryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryOn = [500, 502, 503, 504, 408, 429] // 預設重試的HTTP狀態碼
  } = retryOptions;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios(axiosConfig);
      console.log(`✅ HTTP請求成功 (第${attempt + 1}次嘗試): ${response.status}`);
      return { success: true, data: response.data };
    } catch (error) {
      lastError = error;
      const statusCode = error.response?.status;
      
      // 檢查是否應該重試
      const shouldRetry = attempt < maxRetries && 
                         (retryOn.includes(statusCode) || !error.response);
      
      if (shouldRetry) {
        const delay = retryDelay * Math.pow(2, attempt); // 指數退避
        console.log(`⚠️ HTTP請求失敗 (第${attempt + 1}次嘗試): ${statusCode} ${error.message}`);
        console.log(`🔄 ${delay}ms後重試...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  
  console.log(`❌ HTTP請求最終失敗: ${lastError.response?.status} ${lastError.message}`);
  return { 
    success: false, 
    error: `${lastError.response?.status || ''} ${lastError.message}`,
    attempts: maxRetries + 1
  };
}

// 在節點編輯器中可以添加重試設定
const retrySettings = {
  enableRetry: false,
  maxRetries: 3,
  retryDelay: 1000,
  retryOnStatus: [500, 502, 503, 504, 408, 429]
};