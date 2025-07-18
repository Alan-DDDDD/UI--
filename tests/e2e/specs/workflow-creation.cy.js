describe('工作流程建立測試', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.setupTestTokens();
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it('應該能建立新的工作流程', () => {
    // 建立新流程
    cy.get('[data-testid="new-workflow-btn"]').click();
    
    // 檢查是否顯示空白畫布
    cy.get('[data-testid="reactflow-wrapper"]').should('be.visible');
    cy.get('[data-testid="workflow-nodes"]').should('have.length', 0);
    
    // 設定流程名稱
    cy.get('[data-testid="workflow-settings-btn"]').click();
    cy.get('[data-testid="workflow-name-input"]').clear().type('E2E測試流程');
    cy.get('[data-testid="workflow-settings-save"]').click();
    
    // 儲存流程
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.checkNotification('success', '流程已儲存');
  });

  it('應該能添加HTTP請求節點', () => {
    cy.createTestWorkflow('HTTP測試流程');
    
    // 添加HTTP請求節點
    cy.addNodeToCanvas('http-request');
    
    // 驗證節點已添加
    cy.get('[data-testid="workflow-nodes"]').should('have.length', 1);
    cy.get('[data-node-type="http-request"]').should('be.visible');
    
    // 配置HTTP請求節點
    cy.get('[data-node-type="http-request"]').click();
    cy.configureNode('http-request', {
      url: 'https://api.example.com/users',
      method: 'GET'
    });
    
    // 儲存流程
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.checkNotification('success', '流程已儲存');
  });

  it('應該能添加條件判斷節點', () => {
    cy.createTestWorkflow('條件測試流程');
    
    // 添加條件判斷節點
    cy.addNodeToCanvas('condition');
    
    // 配置條件節點
    cy.get('[data-node-type="condition"]').click();
    cy.configureNode('condition', {
      field: '{message}',
      operator: 'contains',
      value: '你好'
    });
    
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.checkNotification('success', '流程已儲存');
  });

  it('應該能添加LINE回覆節點', () => {
    cy.createTestWorkflow('LINE測試流程');
    
    // 添加LINE回覆節點
    cy.addNodeToCanvas('line-reply');
    
    // 配置LINE回覆節點
    cy.get('[data-node-type="line-reply"]').click();
    cy.configureNode('line-reply', {
      'reply-message': '這是測試回覆訊息',
      'line-token': 'testLineToken'
    });
    
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.checkNotification('success', '流程已儲存');
  });

  it('應該能連接多個節點', () => {
    cy.createTestWorkflow('連接測試流程');
    
    // 添加多個節點
    cy.addNodeToCanvas('http-request', { x: 100, y: 100 });
    cy.addNodeToCanvas('condition', { x: 300, y: 100 });
    cy.addNodeToCanvas('line-reply', { x: 500, y: 100 });
    
    // 連接節點
    cy.connectNodes('http-request', 'condition');
    cy.connectNodes('condition', 'line-reply');
    
    // 驗證連接
    cy.get('[data-testid="workflow-edges"]').should('have.length', 2);
    
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.checkNotification('success', '流程已儲存');
  });

  it('應該能建立複雜的工作流程', () => {
    cy.createTestWorkflow('複雜測試流程');
    
    // 建立一個包含多種節點類型的複雜流程
    cy.addNodeToCanvas('webhook-trigger', { x: 50, y: 100 });
    cy.addNodeToCanvas('http-request', { x: 200, y: 100 });
    cy.addNodeToCanvas('condition', { x: 350, y: 100 });
    cy.addNodeToCanvas('line-reply', { x: 500, y: 50 });
    cy.addNodeToCanvas('notification', { x: 500, y: 150 });
    
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
    
    cy.configureNode('line-reply', {
      'reply-message': '找到用戶: {name}',
      'line-token': 'testLineToken'
    });
    
    cy.configureNode('notification', {
      message: '流程執行完成'
    });
    
    // 連接節點
    cy.connectNodes('webhook-trigger', 'http-request');
    cy.connectNodes('http-request', 'condition');
    cy.connectNodes('condition', 'line-reply');
    cy.connectNodes('condition', 'notification');
    
    // 儲存流程
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.checkNotification('success', '流程已儲存');
    
    // 驗證流程結構
    cy.validateWorkflowStructure(5, 4);
  });

  it('應該能刪除節點', () => {
    cy.createTestWorkflow('刪除測試流程');
    
    // 添加節點
    cy.addNodeToCanvas('http-request');
    cy.addNodeToCanvas('condition');
    
    // 驗證節點已添加
    cy.get('[data-testid="workflow-nodes"]').should('have.length', 2);
    
    // 選擇並刪除節點
    cy.get('[data-node-type="http-request"]').click();
    cy.get('[data-testid="delete-node-btn"]').click();
    
    // 驗證節點已刪除
    cy.get('[data-testid="workflow-nodes"]').should('have.length', 1);
    
    cy.get('[data-testid="save-workflow-btn"]').click();
    cy.checkNotification('success', '流程已儲存');
  });

  it('應該能複製和貼上節點', () => {
    cy.createTestWorkflow('複製測試流程');
    
    // 添加節點
    cy.addNodeToCanvas('http-request');
    
    // 配置節點
    cy.configureNode('http-request', {
      url: 'https://api.example.com/test',
      method: 'POST'
    });
    
    // 選擇節點並複製
    cy.get('[data-node-type="http-request"]').click();
    cy.get('body').type('{ctrl+c}');
    
    // 貼上節點
    cy.get('body').type('{ctrl+v}');
    
    // 驗證節點已複製
    cy.get('[data-testid="workflow-nodes"]').should('have.length', 2);
  });
});