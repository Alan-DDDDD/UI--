import React, { useState } from 'react';
import WorkflowList from './WorkflowList';
import TokenManager from './TokenManager';

function WindowManager({ 
  onSelectWorkflow, 
  onNewWorkflow, 
  currentWorkflowId,
  compact = false,
  showNotification
}) {
  const [showWorkflowWindow, setShowWorkflowWindow] = useState(false);
  const [showTokenWindow, setShowTokenWindow] = useState(false);

  return (
    <>
      {/* 工具列按鈕 */}
      <div className={`toolbar ${compact ? 'compact' : ''}`}>
        <button 
          onClick={() => setShowWorkflowWindow(true)}
          className="toolbar-btn"
          title={compact ? '流程管理' : ''}
        >
          📋 {!compact && '流程管理'}
        </button>
        <button 
          onClick={() => setShowTokenWindow(true)}
          className="toolbar-btn"
          title={compact ? 'Token管理' : ''}
        >
          🔑 {!compact && 'Token管理'}
        </button>
      </div>

      {/* 流程列表視窗 */}
      {showWorkflowWindow && (
        <div className="window-overlay">
          <div className="window">
            <div className="window-header">
              <h3>📋 流程管理</h3>
              <button 
                onClick={() => setShowWorkflowWindow(false)}
                className="window-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="window-content">
              <WorkflowList 
                onSelectWorkflow={(id) => {
                  onSelectWorkflow(id);
                  setShowWorkflowWindow(false);
                }}
                onNewWorkflow={() => {
                  onNewWorkflow();
                  setShowWorkflowWindow(false);
                }}
                currentWorkflowId={currentWorkflowId}
                showNotification={showNotification}
              />
            </div>
          </div>
        </div>
      )}

      {/* Token管理視窗 */}
      {showTokenWindow && (
        <div className="window-overlay">
          <div className="window">
            <div className="window-header">
              <h3>🔑 Token管理</h3>
              <button 
                onClick={() => setShowTokenWindow(false)}
                className="window-close-btn"
              >
                ✕
              </button>
            </div>
            <div className="window-content">
              <TokenManager />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WindowManager;