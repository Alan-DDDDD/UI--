#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 檢查部署配置...\n');

// 檢查前端配置
console.log('📱 前端配置檢查:');
const clientPackage = JSON.parse(fs.readFileSync('./client/package.json', 'utf8'));
console.log(`✅ Homepage: ${clientPackage.homepage}`);

const envProd = fs.readFileSync('./client/.env.production', 'utf8');
console.log(`✅ API URL: ${envProd.trim()}`);

// 檢查 GitHub Actions
const deployYml = fs.readFileSync('./.github/workflows/deploy.yml', 'utf8');
if (deployYml.includes('peaceiris/actions-gh-pages')) {
  console.log('✅ GitHub Actions 配置正確');
} else {
  console.log('❌ GitHub Actions 配置有問題');
}

// 檢查後端配置
console.log('\n🔧 後端配置檢查:');
const vercelJson = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));
console.log(`✅ Vercel 入口點: ${vercelJson.builds[0].src}`);

const apiIndex = fs.readFileSync('./api/index.js', 'utf8');
if (apiIndex.includes('/api/health')) {
  console.log('✅ 健康檢查端點存在');
} else {
  console.log('❌ 缺少健康檢查端點');
}

// 檢查必要文件
console.log('\n📁 必要文件檢查:');
const requiredFiles = [
  './package.json',
  './client/package.json',
  './vercel.json',
  './api/index.js',
  './.github/workflows/deploy.yml'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} 不存在`);
  }
});

console.log('\n🚀 部署步驟:');
console.log('1. 推送代碼到 GitHub main 分支');
console.log('2. GitHub Actions 自動部署前端到 GitHub Pages');
console.log('3. 在 Vercel 導入 GitHub repository');
console.log('4. 設定 Root Directory 為根目錄');
console.log('5. Vercel 自動檢測 vercel.json 配置');

console.log('\n📋 部署後測試:');
console.log('- 前端: https://alan-ddddd.github.io/UI--');
console.log('- 後端: https://your-vercel-app.vercel.app/api/health');
console.log('- Webhook: https://your-vercel-app.vercel.app/webhook/line/{workflowId}');