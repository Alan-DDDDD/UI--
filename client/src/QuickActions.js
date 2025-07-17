import React, { useState, useEffect } from 'react';
import './QuickActions.css';

function QuickActions({ 
  onSaveWorkflow, 
  onExecuteWorkflow, 
  onValidateWorkflow,
  hasUnsavedChanges,
  isExecuting 
}) {
  const [showTooltip, setShowTooltip] = useState(null);

  // 鍵盤快捷鍵支援
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 's':
            event.preventDefault();
            onSaveWorkflow();
            break;
          case 'r':
            event.preventDefault();
            if (!isExecuting) {
              onExecuteWorkflow();
            }
            break;
          case 't':
            event.preventDefault();
            if (!isExecuting) {
              onValidateWorkflow();
            }
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSaveWorkflow, onExecuteWorkflow, onValidateWorkflow, isExecuting]);

  const actions = [
    {
      id: 'save',
      icon: '💾',
      label: '儲存流程',
      shortcut: 'Ctrl+S',
      onClick: onSaveWorkflow,
      highlight: hasUnsavedChanges,
      disabled: false
    },
    {
      id: 'execute',
      icon: '▶️',
      label: '執行流程',
      shortcut: 'Ctrl+R',
      onClick: onExecuteWorkflow,
      highlight: false,
      disabled: isExecuting
    },
    {
      id: 'validate',
      icon: '🔍',
      label: '驗證流程',
      shortcut: 'Ctrl+T',
      onClick: onValidateWorkflow,
      highlight: false,
      disabled: isExecuting
    }
  ];

  return (
    <div className="quick-actions-toolbar">
      {actions.map(action => (
        <div
          key={action.id}
          className={`quick-action-item ${action.highlight ? 'highlight' : ''} ${action.disabled ? 'disabled' : ''}`}
          onClick={action.disabled ? undefined : action.onClick}
          onMouseEnter={() => setShowTooltip(action.id)}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <div className="action-icon">{action.icon}</div>
          
          {showTooltip === action.id && (
            <div className="action-tooltip">
              <div className="tooltip-label">{action.label}</div>
              <div className="tooltip-shortcut">{action.shortcut}</div>
            </div>
          )}
        </div>
      ))}
      
      {isExecuting && (
        <div className="execution-indicator">
          <div className="spinner-small"></div>
          <span>執行中...</span>
        </div>
      )}
    </div>
  );
}

export default QuickActions;