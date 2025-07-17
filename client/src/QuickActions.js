import React, { useState, useEffect } from 'react';
import './QuickActions.css';

function QuickActions({ 
  onSaveWorkflow, 
  onExecuteWorkflow, 
  onValidateWorkflow,
  hasUnsavedChanges,
  isExecuting,
  smartHintsEnabled,
  onToggleSmartHints,
  onOpenSettings,
  onOpenManual,
  workflowId,
  onShowWebhookUrl
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
          case 'h':
            event.preventDefault();
            onToggleSmartHints();
            break;
          case ',':
            event.preventDefault();
            onOpenSettings();
            break;
          default:
            break;
        }
      } else if (event.key === 'F1') {
        event.preventDefault();
        onOpenManual();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSaveWorkflow, onExecuteWorkflow, onValidateWorkflow, onToggleSmartHints, onOpenSettings, onOpenManual, isExecuting]);

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
    },
    {
      id: 'smart-hints',
      icon: smartHintsEnabled ? '💡' : '🔅',
      label: smartHintsEnabled ? '關閉智能提示' : '開啟智能提示',
      shortcut: 'Ctrl+H',
      onClick: onToggleSmartHints,
      highlight: smartHintsEnabled,
      disabled: false
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: '流程設定',
      shortcut: 'Ctrl+,',
      onClick: onOpenSettings,
      highlight: false,
      disabled: false
    },
    {
      id: 'webhook-url',
      icon: '🔗',
      label: 'Webhook網址',
      shortcut: '',
      onClick: () => onShowWebhookUrl && onShowWebhookUrl(),
      highlight: false,
      disabled: !workflowId
    },
    {
      id: 'manual',
      icon: '📖',
      label: '使用說明書',
      shortcut: 'F1',
      onClick: onOpenManual,
      highlight: false,
      disabled: false
    }
  ];

  const renderActionButton = (action, index) => (
    <div
      key={action.id}
      className={`quick-action-item ${action.highlight ? 'highlight' : ''} ${action.disabled ? 'disabled' : ''}`}
      data-action={action.id}
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
  );

  return (
    <div className="quick-actions-toolbar">
      {/* 主要操作 */}
      {actions.slice(0, 3).map((action, index) => renderActionButton(action, index))}
      
      {/* 分隔線 */}
      <div className="action-separator"></div>
      
      {/* 輔助功能 */}
      {actions.slice(3).map((action, index) => renderActionButton(action, index + 3))}
      
      {isExecuting && (
        <>
          <div className="action-separator"></div>
          <div className="execution-indicator">
            <div className="spinner-small"></div>
            <span>執行中...</span>
          </div>
        </>
      )}
    </div>
  );
}

export default QuickActions;