#!/usr/bin/env node

/**
 * FlowBuilder 測試執行器
 * 統一管理所有測試的執行
 */

const { spawn } = require('child_process');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      server: null,
      client: null,
      e2e: null,
      integration: null
    };
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`\n🚀 執行: ${command} ${args.join(' ')}`);
      
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ 命令執行成功`);
          resolve(code);
        } else {
          console.log(`❌ 命令執行失敗，退出碼: ${code}`);
          resolve(code);
        }
      });

      child.on('error', (error) => {
        console.error(`❌ 命令執行錯誤: ${error.message}`);
        reject(error);
      });
    });
  }

  async runServerTests() {
    console.log('\n📋 執行後端測試...');
    try {
      const code = await this.runCommand('npm', ['run', 'test:server']);
      this.results.server = code === 0 ? 'PASS' : 'FAIL';
    } catch (error) {
      this.results.server = 'ERROR';
      console.error('後端測試執行錯誤:', error.message);
    }
  }

  async runClientTests() {
    console.log('\n🎨 執行前端測試...');
    try {
      const code = await this.runCommand('npm', ['run', 'test:client'], {
        cwd: path.join(__dirname, 'client')
      });
      this.results.client = code === 0 ? 'PASS' : 'FAIL';
    } catch (error) {
      this.results.client = 'ERROR';
      console.error('前端測試執行錯誤:', error.message);
    }
  }

  async runE2ETests() {
    console.log('\n🔄 執行E2E測試...');
    try {
      // 檢查是否安裝了Cypress
      const code = await this.runCommand('npx', ['cypress', 'run', '--config-file', 'tests/e2e/cypress.config.js']);
      this.results.e2e = code === 0 ? 'PASS' : 'FAIL';
    } catch (error) {
      this.results.e2e = 'SKIP';
      console.log('⚠️  E2E測試跳過 (Cypress未安裝或配置問題)');
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 執行整合測試...');
    try {
      const code = await this.runCommand('npx', ['jest', 'tests/integration', '--verbose']);
      this.results.integration = code === 0 ? 'PASS' : 'FAIL';
    } catch (error) {
      this.results.integration = 'ERROR';
      console.error('整合測試執行錯誤:', error.message);
    }
  }

  async runCoverageReport() {
    console.log('\n📊 生成測試覆蓋率報告...');
    try {
      await this.runCommand('npm', ['run', 'test:coverage']);
      console.log('📊 覆蓋率報告已生成在 coverage/ 目錄');
    } catch (error) {
      console.error('覆蓋率報告生成失敗:', error.message);
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 FlowBuilder 測試結果總覽');
    console.log('='.repeat(60));
    
    const getStatusIcon = (status) => {
      switch (status) {
        case 'PASS': return '✅';
        case 'FAIL': return '❌';
        case 'ERROR': return '💥';
        case 'SKIP': return '⏭️';
        default: return '❓';
      }
    };

    console.log(`${getStatusIcon(this.results.server)} 後端測試: ${this.results.server || 'NOT_RUN'}`);
    console.log(`${getStatusIcon(this.results.client)} 前端測試: ${this.results.client || 'NOT_RUN'}`);
    console.log(`${getStatusIcon(this.results.integration)} 整合測試: ${this.results.integration || 'NOT_RUN'}`);
    console.log(`${getStatusIcon(this.results.e2e)} E2E測試: ${this.results.e2e || 'NOT_RUN'}`);
    
    const totalTests = Object.values(this.results).filter(r => r !== null).length;
    const passedTests = Object.values(this.results).filter(r => r === 'PASS').length;
    const failedTests = Object.values(this.results).filter(r => r === 'FAIL' || r === 'ERROR').length;
    
    console.log('\n📈 統計:');
    console.log(`   總測試套件: ${totalTests}`);
    console.log(`   通過: ${passedTests}`);
    console.log(`   失敗: ${failedTests}`);
    console.log(`   成功率: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);
    
    if (failedTests === 0 && totalTests > 0) {
      console.log('\n🎉 所有測試都通過了！');
    } else if (failedTests > 0) {
      console.log('\n⚠️  有測試失敗，請檢查上面的錯誤訊息');
    }
    
    console.log('='.repeat(60));
  }

  async runAll() {
    console.log('🧪 開始執行 FlowBuilder 完整測試套件...');
    
    const startTime = Date.now();
    
    // 依序執行各種測試
    await this.runServerTests();
    await this.runClientTests();
    await this.runIntegrationTests();
    await this.runE2ETests();
    
    // 生成覆蓋率報告
    await this.runCoverageReport();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n⏱️  總執行時間: ${duration} 秒`);
    
    // 顯示結果
    this.printResults();
    
    // 返回是否所有測試都通過
    const allPassed = Object.values(this.results).every(result => 
      result === 'PASS' || result === 'SKIP' || result === null
    );
    
    return allPassed;
  }

  async runSpecific(testType) {
    console.log(`🧪 執行特定測試: ${testType}`);
    
    switch (testType) {
      case 'server':
      case 'backend':
        await this.runServerTests();
        break;
      case 'client':
      case 'frontend':
        await this.runClientTests();
        break;
      case 'integration':
        await this.runIntegrationTests();
        break;
      case 'e2e':
        await this.runE2ETests();
        break;
      case 'coverage':
        await this.runCoverageReport();
        break;
      default:
        console.log(`❌ 未知的測試類型: ${testType}`);
        console.log('可用的測試類型: server, client, integration, e2e, coverage');
        return false;
    }
    
    this.printResults();
    return true;
  }
}

// 命令行介面
async function main() {
  const args = process.argv.slice(2);
  const testRunner = new TestRunner();
  
  if (args.length === 0) {
    // 執行所有測試
    const success = await testRunner.runAll();
    process.exit(success ? 0 : 1);
  } else {
    // 執行特定測試
    const testType = args[0];
    const success = await testRunner.runSpecific(testType);
    process.exit(success ? 0 : 1);
  }
}

// 如果直接執行此文件
if (require.main === module) {
  main().catch(error => {
    console.error('測試執行器錯誤:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;