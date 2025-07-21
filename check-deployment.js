const axios = require('axios');

async function checkDeployment() {
  console.log('🔍 檢查部署狀態...\n');
  
  // 檢查前端 GitHub Pages
  try {
    console.log('📱 檢查前端 (GitHub Pages)...');
    const frontendResponse = await axios.get('https://alan-ddddd.github.io/UI--/', {
      timeout: 10000
    });
    console.log('✅ 前端部署成功');
    console.log('🌐 前端網址: https://alan-ddddd.github.io/UI--/');
  } catch (error) {
    console.log('❌ 前端部署檢查失敗:', error.message);
    console.log('⏳ GitHub Pages 可能需要幾分鐘時間部署...');
  }
  
  // 檢查後端 Vercel (如果已部署)
  try {
    console.log('\n🔧 檢查後端 (Vercel)...');
    const backendResponse = await axios.get('https://ui-eight-alpha.vercel.app/api/health', {
      timeout: 10000
    });
    console.log('✅ 後端部署成功');
    console.log('🌐 後端網址: https://ui-eight-alpha.vercel.app');
    console.log('📊 API 狀態:', backendResponse.data);
  } catch (error) {
    console.log('❌ 後端尚未部署或無法訪問');
    console.log('💡 請前往 https://vercel.com 部署後端');
  }
  
  console.log('\n📋 部署檢查完成');
}

checkDeployment();