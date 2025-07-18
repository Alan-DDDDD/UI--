// 自定義Cypress命令

// 登入命令（如果需要）
Cypress.Commands.add('login', (username, password) => {
  // 實現登入邏輯
});

// 建立測試工作流程
Cypress.Commands.add('createTestWorkflow', (workflowName = '測試流程') => {
  cy.get('[data-testid="new-workflow-btn"]').click();
  cy.get('[data-testid="workflow-name-input"]').clear().type(workflowName);
  cy.get('[data-testid="save-workflow-btn"]').click();
});

// 添加節點到畫布
Cypress.Commands.add('addNodeToCanvas', (nodeType, position = { x: 200, y: 200 }) => {
  // 從節點面板拖拽節點到畫布
  cy.get(`[data-node-type="${nodeType}"]`).trigger('dragstart');
  cy.get('[data-testid="reactflow-wrapper"]')
    .trigger('dragover', position)
    .trigger('drop', position);
});

// 連接兩個節點
Cypress.Commands.add('connectNodes', (sourceNodeId, targetNodeId) => {
  cy.get(`[data-id="${sourceNodeId}"] .react-flow__handle-right`).click();
  cy.get(`[data-id="${targetNodeId}"] .react-flow__handle-left`).click();
});

// 設定節點屬性
Cypress.Commands.add('configureNode', (nodeId, config) => {
  cy.get(`[data-id="${nodeId}"]`).click();
  
  Object.keys(config).forEach(key => {
    cy.get(`[data-testid="${key}-input"]`).clear().type(config[key]);
  });
  
  cy.get('[data-testid="node-editor-save"]').click();
});

// 執行工作流程
Cypress.Commands.add('executeWorkflow', () => {
  cy.get('[data-testid="execute-workflow-btn"]').click();
});

// 等待執行完成
Cypress.Commands.add('waitForExecution', () => {
  cy.get('[data-testid="execution-status"]', { timeout: 30000 })
    .should('contain', '執行完成');
});

// 檢查通知
Cypress.Commands.add('checkNotification', (type, message) => {
  cy.get(`[data-testid="notification-${type}"]`)
    .should('be.visible')
    .and('contain', message);
});

// 清理測試數據
Cypress.Commands.add('cleanupTestData', () => {
  // 刪除測試建立的工作流程
  cy.request('DELETE', '/api/test/cleanup');
});

// 模擬API回應
Cypress.Commands.add('mockApiResponse', (url, response) => {
  cy.intercept('GET', url, response).as('apiCall');
});

// 設定測試Token
Cypress.Commands.add('setupTestTokens', () => {
  cy.request('POST', 'http://localhost:3001/api/tokens', {
    key: 'testLineToken',
    name: '測試LINE Token',
    token: 'test-line-token-for-e2e'
  });
});

// 驗證工作流程結構
Cypress.Commands.add('validateWorkflowStructure', (expectedNodes, expectedEdges) => {
  cy.get('[data-testid="workflow-nodes"]').should('have.length', expectedNodes);
  cy.get('[data-testid="workflow-edges"]').should('have.length', expectedEdges);
});

// 開始調試會話
Cypress.Commands.add('startDebugSession', () => {
  cy.get('[data-testid="debug-start-btn"]').click();
  cy.get('[data-testid="debug-status"]').should('contain', '調試中');
});

// 單步執行
Cypress.Commands.add('stepExecution', () => {
  cy.get('[data-testid="debug-step-btn"]').click();
});

// 設定斷點
Cypress.Commands.add('setBreakpoint', (nodeId) => {
  cy.get(`[data-id="${nodeId}"]`).rightclick();
  cy.get('[data-testid="set-breakpoint"]').click();
});