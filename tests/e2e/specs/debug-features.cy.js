describe('調試功能測試', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.setupTestTokens();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it('應該能開始調試會話', () => {
    cy.createTestWorkflow('調試測試流程');
    
    // 建立簡單流程
    cy.addNodeToCanvas('http-request');
    cy.addNodeToCanvas('notification');
    
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/1',
      method: 'GET'
    });
    
    cy.configureNode('notification', {
      message: '調試測試完成'
    });
    
    cy.connectNodes('http-request', 'notification');
    
    // 儲存流程
    cy.get('[data-testid="save-workflow-btn"]').click();
    
    // 開始調試
    cy.startDebugSession();
    
    // 檢查調試狀態
    cy.get('[data-testid="debug-toolbar"]').should('be.visible');
    cy.get('[data-testid="debug-status"]').should('contain', '調試中');
  });

  it('應該能設定和移除斷點', () => {
    cy.createTestWorkflow('斷點測試流程');
    
    // 建立流程
    cy.addNodeToCanvas('http-request');
    cy.addNodeToCanvas('notification');
    
    // 在第一個節點設定斷點
    cy.setBreakpoint('http-request');
    
    // 檢查斷點標記
    cy.get('[data-id="http-request"]')
      .should('have.class', 'has-breakpoint');
    
    // 移除斷點
    cy.get('[data-id="http-request"]').rightclick();
    cy.get('[data-testid="remove-breakpoint"]').click();
    
    // 檢查斷點已移除
    cy.get('[data-id="http-request"]')
      .should('not.have.class', 'has-breakpoint');
  });

  it('應該能單步執行流程', () => {
    cy.createTestWorkflow('單步執行測試');
    
    // 建立多步驟流程
    cy.addNodeToCanvas('http-request', { x: 100, y: 100 });
    cy.addNodeToCanvas('condition', { x: 300, y: 100 });
    cy.addNodeToCanvas('notification', { x: 500, y: 100 });
    
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/1',
      method: 'GET'
    });
    
    cy.configureNode('condition', {
      field: '{name}',
      operator: '==',
      value: 'Alice'
    });
    
    cy.configureNode('notification', {
      message: '單步執行測試'
    });
    
    cy.connectNodes('http-request', 'condition');
    cy.connectNodes('condition', 'notification');
    
    // 儲存並開始調試
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.startDebugSession();
    
    // 單步執行第一個節點
    cy.stepExecution();
    cy.get('[data-id="http-request"]')
      .should('have.class', 'currently-executing');
    
    // 單步執行第二個節點
    cy.stepExecution();
    cy.get('[data-id="condition"]')
      .should('have.class', 'currently-executing');
    
    // 單步執行第三個節點
    cy.stepExecution();
    cy.get('[data-id="notification"]')
      .should('have.class', 'currently-executing');
  });

  it('應該能在斷點處暫停', () => {
    cy.createTestWorkflow('斷點暫停測試');
    
    // 建立流程
    cy.addNodeToCanvas('http-request', { x: 100, y: 100 });
    cy.addNodeToCanvas('notification', { x: 300, y: 100 });
    
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/1',
      method: 'GET'
    });
    
    cy.configureNode('notification', {
      message: '斷點測試'
    });
    
    cy.connectNodes('http-request', 'notification');
    
    // 在第二個節點設定斷點
    cy.setBreakpoint('notification');
    
    // 儲存並開始調試
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.startDebugSession();
    
    // 繼續執行（應該在斷點處暫停）
    cy.get('[data-testid="debug-continue-btn"]').click();
    
    // 檢查是否在斷點處暫停
    cy.get('[data-testid="debug-status"]').should('contain', '已暫停');
    cy.get('[data-id="notification"]')
      .should('have.class', 'currently-executing');
  });

  it('應該能檢視變數和上下文', () => {
    cy.createTestWorkflow('變數檢視測試');
    
    // 建立流程
    cy.addNodeToCanvas('http-request');
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/1',
      method: 'GET'
    });
    
    // 儲存並開始調試
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.startDebugSession();
    
    // 執行第一步
    cy.stepExecution();
    
    // 開啟變數檢視器
    cy.get('[data-testid="variable-inspector-btn"]').click();
    
    // 檢查變數檢視器
    cy.get('[data-testid="variable-inspector"]').should('be.visible');
    cy.get('[data-testid="context-variables"]').should('contain', 'name');
    cy.get('[data-testid="context-variables"]').should('contain', 'Alice');
  });

  it('應該能暫停和繼續執行', () => {
    cy.createTestWorkflow('暫停繼續測試');
    
    // 建立較長的流程
    cy.addNodeToCanvas('http-request', { x: 100, y: 100 });
    cy.addNodeToCanvas('notification', { x: 300, y: 100 });
    cy.addNodeToCanvas('http-request', { x: 500, y: 100 });
    
    // 配置節點
    cy.get('[data-testid="workflow-nodes"]').eq(0).click();
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/1',
      method: 'GET'
    });
    
    cy.get('[data-testid="workflow-nodes"]').eq(1).click();
    cy.configureNode('notification', {
      message: '中間步驟'
    });
    
    cy.get('[data-testid="workflow-nodes"]').eq(2).click();
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/orders/1',
      method: 'GET'
    });
    
    // 連接節點
    cy.connectNodes('http-request', 'notification');
    cy.connectNodes('notification', 'http-request');
    
    // 儲存並開始調試
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.startDebugSession();
    
    // 開始執行
    cy.get('[data-testid="debug-continue-btn"]').click();
    
    // 暫停執行
    cy.get('[data-testid="debug-pause-btn"]').click();
    cy.get('[data-testid="debug-status"]').should('contain', '已暫停');
    
    // 繼續執行
    cy.get('[data-testid="debug-continue-btn"]').click();
    cy.get('[data-testid="debug-status"]').should('contain', '執行中');
  });

  it('應該能停止調試會話', () => {
    cy.createTestWorkflow('停止調試測試');
    
    // 建立簡單流程
    cy.addNodeToCanvas('notification');
    cy.configureNode('notification', {
      message: '停止測試'
    });
    
    // 儲存並開始調試
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.startDebugSession();
    
    // 停止調試
    cy.get('[data-testid="debug-stop-btn"]').click();
    
    // 檢查調試已停止
    cy.get('[data-testid="debug-status"]').should('contain', '已停止');
    cy.get('[data-testid="debug-toolbar"]').should('not.be.visible');
  });

  it('應該能顯示執行歷史', () => {
    cy.createTestWorkflow('執行歷史測試');
    
    // 建立流程
    cy.addNodeToCanvas('http-request');
    cy.addNodeToCanvas('notification');
    
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/1',
      method: 'GET'
    });
    
    cy.configureNode('notification', {
      message: '歷史測試: {name}'
    });
    
    cy.connectNodes('http-request', 'notification');
    
    // 儲存並開始調試
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.startDebugSession();
    
    // 執行完整流程
    cy.get('[data-testid="debug-continue-btn"]').click();
    
    // 等待執行完成
    cy.get('[data-testid="debug-status"]', { timeout: 10000 })
      .should('contain', '執行完成');
    
    // 檢查執行歷史
    cy.get('[data-testid="execution-history"]').should('be.visible');
    cy.get('[data-testid="history-step"]').should('have.length', 2);
    
    // 檢查每個步驟的結果
    cy.get('[data-testid="history-step"]').eq(0)
      .should('contain', 'http-request')
      .and('contain', '成功');
    
    cy.get('[data-testid="history-step"]').eq(1)
      .should('contain', 'notification')
      .and('contain', '歷史測試: Alice');
  });

  it('應該能處理調試中的錯誤', () => {
    cy.createTestWorkflow('調試錯誤測試');
    
    // 建立會產生錯誤的流程
    cy.addNodeToCanvas('http-request');
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/nonexistent-endpoint',
      method: 'GET'
    });
    
    // 儲存並開始調試
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.startDebugSession();
    
    // 執行會失敗的節點
    cy.stepExecution();
    
    // 檢查錯誤處理
    cy.get('[data-testid="debug-error"]').should('be.visible');
    cy.get('[data-testid="error-details"]').should('contain', '404');
    
    // 檢查變數檢視器中的錯誤信息
    cy.get('[data-testid="variable-inspector-btn"]').click();
    cy.get('[data-testid="error-context"]').should('be.visible');
  });
});