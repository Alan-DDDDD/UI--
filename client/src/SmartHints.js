import React, { useState, useEffect } from 'react';

function SmartHints({ nodes, selectedNode }) {
  const [hints, setHints] = useState([]);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    generateHints();
  }, [nodes, selectedNode]);

  const generateHints = () => {
    const newHints = [];

    // 檢查是否有existing-workflow節點但沒有參數映射
    const workflowRefNodes = nodes.filter(n => 
      n.data.type === 'existing-workflow' || n.data.type === 'workflow-reference'
    );

    workflowRefNodes.forEach(node => {
      if (!node.data.paramMappings || node.data.paramMappings.length === 0) {
        newHints.push({
          type: 'warning',
          title: '參數映射建議',
          message: `節點 "${node.data.label}" 尚未設定參數映射，可能無法正確傳遞資料`,
          nodeId: node.id,
          action: 'configure-params'
        });
      }
    });

    // 檢查是否有孤立的節點
    const isolatedNodes = nodes.filter(node => {
      const hasIncoming = nodes.some(n => 
        n.data.edges && n.data.edges.some(e => e.target === node.id)
      );
      const hasOutgoing = node.data.edges && node.data.edges.length > 0;
      return !hasIncoming && !hasOutgoing && node.data.type !== 'webhook-trigger';
    });

    if (isolatedNodes.length > 0) {
      newHints.push({
        type: 'info',
        title: '連接建議',
        message: `發現 ${isolatedNodes.length} 個未連接的節點，建議連接到流程中`,
        action: 'connect-nodes'
      });
    }

    // 檢查是否有循環引用的可能
    workflowRefNodes.forEach(node => {
      if (node.data.workflowId) {
        newHints.push({
          type: 'info',
          title: '最佳實踐',
          message: `使用子流程時建議設定清楚的輸入輸出參數，提高流程的可維護性`,
          nodeId: node.id,
          action: 'best-practice'
        });
      }
    });

    setHints(newHints);
    setShowHints(newHints.length > 0);
  };

  const getHintIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return '💡';
      case 'success': return '✅';
      default: return '💡';
    }
  };

  const getHintColor = (type) => {
    switch (type) {
      case 'warning': return '#FF9800';
      case 'error': return '#dc3545';
      case 'info': return '#2196F3';
      case 'success': return '#4CAF50';
      default: return '#2196F3';
    }
  };

  if (!showHints || hints.length === 0) return null;

  return (
    <div className="smart-hints-panel">
      <div className="hints-header">
        <h4>💡 智能建議</h4>
        <button 
          className="hints-close-btn"
          onClick={() => setShowHints(false)}
        >
          ✕
        </button>
      </div>
      
      <div className="hints-list">
        {hints.map((hint, index) => (
          <div 
            key={index} 
            className={`hint-item hint-${hint.type}`}
            style={{ borderLeftColor: getHintColor(hint.type) }}
          >
            <div className="hint-icon">
              {getHintIcon(hint.type)}
            </div>
            <div className="hint-content">
              <div className="hint-title">{hint.title}</div>
              <div className="hint-message">{hint.message}</div>
              {hint.action && (
                <div className="hint-actions">
                  <button 
                    className="hint-action-btn"
                    onClick={() => handleHintAction(hint)}
                  >
                    {getActionText(hint.action)}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="hints-footer">
        <small>這些建議基於當前流程結構自動生成</small>
      </div>
    </div>
  );

  function handleHintAction(hint) {
    switch (hint.action) {
      case 'configure-params':
        // 觸發參數配置
        if (hint.nodeId) {
          const node = nodes.find(n => n.id === hint.nodeId);
          if (node) {
            // 這裡可以觸發節點編輯器打開
            console.log('打開節點編輯器:', node);
          }
        }
        break;
      case 'connect-nodes':
        // 提示用戶連接節點
        alert('請拖拽節點之間的連接點來建立流程連接');
        break;
      case 'best-practice':
        // 顯示最佳實踐提示
        alert('建議在子流程中明確定義輸入輸出參數，並使用描述性的參數名稱');
        break;
      default:
        break;
    }
  }

  function getActionText(action) {
    switch (action) {
      case 'configure-params': return '配置參數';
      case 'connect-nodes': return '了解連接';
      case 'best-practice': return '查看建議';
      default: return '處理';
    }
  }
}

export default SmartHints;