// Cypress E2E 支援文件
import './commands';

// 全域設定
Cypress.on('uncaught:exception', (err, runnable) => {
  // 忽略某些不影響測試的錯誤
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// 設定預設等待時間
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);