describe('工作流程執行測試', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.setupTestTokens();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it('應該能執行簡單的HTTP請求流程', () => {
    cy.createTestWorkflow('HTTP執行測試');
    
    // 建立簡單的HTTP請求流程
    cy.addNodeToCanvas('http-request');
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/1',
      method: 'GET'
    });
    
    // 儲存流程
    cy.get('[data-testid="save-workflow-btn"]').click();
    
    // 執行流程
    cy.executeWorkflow();
    
    // 等待執行完成
    cy.waitForExecution();
    
    // 檢查執行結果
    cy.get('[data-testid="execution-results"]').should('be.visible');
    cy.get('[data-testid="execution-success"]').should('contain', '執行成功');
  });

  it('應該能執行條件判斷流程', () => {
    cy.createTestWorkflow('條件執行測試');
    
    // 建立條件判斷流程
    cy.addNodeToCanvas('http-request', { x: 100, y: 100 });
    cy.addNodeToCanvas('condition', { x: 300, y: 100 });
    cy.addNodeToCanvas('notification', { x: 500, y: 100 });
    
    // 配置節點
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
      message: '找到Alice用戶'
    });
    
    // 連接節點
    cy.connectNodes('http-request', 'condition');
    cy.connectNodes('condition', 'notification');
    
    // 儲存並執行
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.executeWorkflow();
    cy.waitForExecution();
    
    // 檢查執行結果
    cy.get('[data-testid="execution-results"]').should('contain', '找到Alice用戶');
  });

  it('應該能處理執行錯誤', () => {
    cy.createTestWorkflow('錯誤處理測試');
    
    // 建立會產生錯誤的流程
    cy.addNodeToCanvas('http-request');
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/nonexistent-endpoint',
      method: 'GET'
    });
    
    // 儲存並執行
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.executeWorkflow();
    
    // 等待執行完成（即使失敗）
    cy.get('[data-testid="execution-status"]', { timeout: 30000 })
      .should('not.contain', '執行中');
    
    // 檢查錯誤處理
    cy.get('[data-testid="execution-error"]').should('be.visible');
    cy.checkNotification('error', '執行失敗');
  });

  it('應該能執行包含資料映射的流程', () => {
    cy.createTestWorkflow('資料映射測試');
    
    // 建立包含資料映射的流程
    cy.addNodeToCanvas('http-request', { x: 100, y: 100 });
    cy.addNodeToCanvas('data-map', { x: 300, y: 100 });
    cy.addNodeToCanvas('notification', { x: 500, y: 100 });
    
    // 配置節點
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/1',
      method: 'GET'
    });
    
    cy.configureNode('data-map', {
      'mapping-from-0': 'name',
      'mapping-to-0': 'userName',
      'mapping-from-1': 'email',
      'mapping-to-1': 'userEmail'
    });
    
    cy.configureNode('notification', {
      message: '用戶名稱: {userName}, 郵箱: {userEmail}'
    });
    
    // 連接節點
    cy.connectNodes('http-request', 'data-map');
    cy.connectNodes('data-map', 'notification');
    
    // 儲存並執行
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.executeWorkflow();
    cy.waitForExecution();
    
    // 檢查執行結果
    cy.get('[data-testid="execution-results"]')
      .should('contain', '用戶名稱: Alice')
      .and('contain', 'alice@example.com');
  });

  it('應該能執行複雜的分支流程', () => {
    cy.createTestWorkflow('分支流程測試');
    
    // 建立複雜的分支流程
    cy.addNodeToCanvas('http-request', { x: 100, y: 100 });
    cy.addNodeToCanvas('condition', { x: 300, y: 100 });
    cy.addNodeToCanvas('notification', { x: 500, y: 50 });  // 成功分支
    cy.addNodeToCanvas('notification', { x: 500, y: 150 }); // 失敗分支
    
    // 配置節點
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/2',
      method: 'GET'
    });
    
    cy.configureNode('condition', {
      field: '{department}',
      operator: '==',
      value: 'Sales'
    });
    
    // 配置成功分支通知
    cy.get('[data-testid="workflow-nodes"]').eq(2).click();
    cy.configureNode('notification', {
      message: '用戶屬於銷售部門'
    });
    
    // 配置失敗分支通知
    cy.get('[data-testid="workflow-nodes"]').eq(3).click();
    cy.configureNode('notification', {
      message: '用戶不屬於銷售部門'
    });
    
    // 連接節點
    cy.connectNodes('http-request', 'condition');
    cy.connectNodes('condition', 'notification'); // 連接到成功分支
    
    // 儲存並執行
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.executeWorkflow();
    cy.waitForExecution();
    
    // 檢查執行結果（Bob屬於Sales部門）
    cy.get('[data-testid="execution-results"]')
      .should('contain', '用戶屬於銷售部門');
  });

  it('應該能顯示執行進度', () => {
    cy.createTestWorkflow('進度測試');
    
    // 建立多步驟流程
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
      message: '第一步完成'
    });
    
    cy.get('[data-testid="workflow-nodes"]').eq(2).click();
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/orders/1',
      method: 'GET'
    });
    
    // 連接節點
    cy.connectNodes('http-request', 'notification');
    cy.connectNodes('notification', 'http-request');
    
    // 儲存並執行
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.executeWorkflow();
    
    // 檢查執行進度
    cy.get('[data-testid="execution-progress"]').should('be.visible');
    cy.get('[data-testid="progress-bar"]').should('exist');
    
    cy.waitForExecution();
    
    // 檢查最終結果
    cy.get('[data-testid="execution-results"]').should('be.visible');
  });

  it('應該能執行帶參數的流程', () => {
    cy.createTestWorkflow('參數測試流程');
    
    // 設定流程參數
    cy.get('[data-testid="workflow-settings-btn"]').click();
    cy.get('[data-testid="add-input-param"]').click();
    cy.get('[data-testid="param-name-0"]').type('userId');
    cy.get('[data-testid="param-type-0"]').select('string');
    cy.get('[data-testid="param-required-0"]').check();
    cy.get('[data-testid="workflow-settings-save"]').click();
    
    // 建立使用參數的流程
    cy.addNodeToCanvas('http-request');
    cy.configureNode('http-request', {
      url: 'http://localhost:3001/test/users/{userId}',
      method: 'GET'
    });
    
    // 儲存流程
    cy.get('[data-testid="save-workflow-btn"]').click();
    
    // 執行流程（應該顯示參數輸入對話框）
    cy.get('[data-testid="execute-workflow-btn"]').click();
    
    // 填入參數
    cy.get('[data-testid="param-input-userId"]').type('2');
    cy.get('[data-testid="execute-with-params"]').click();
    
    cy.waitForExecution();
    
    // 檢查執行結果
    cy.get('[data-testid="execution-results"]')
      .should('contain', 'Bob'); // userId=2 對應Bob
  });
});