import React, { useState, useEffect } from 'react';
import './SmartHints.css';

function SmartHints({ nodes, selectedNode, showNotification }) {
  const [hints, setHints] = useState([]);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    generateHints();
  }, [nodes, selectedNode]);

  const generateHints = () => {
    const newHints = [];

    // 檢查流程完整性
    if (nodes.length === 0) {
      newHints.push({
        type: 'info',
        title: '開始建立流程',
        message: '從左側面板拖拽節點到畫布上開始建立您的流程',
        action: 'get-started'
      });
      setHints(newHints);
      setShowHints(true);
      return;
    }

    // 檢查是否有起始節點
    const hasStartNode = nodes.some(n => 
      n.data.type === 'webhook-trigger' || n.data.type === 'program-entry'
    );
    if (!hasStartNode) {
      newHints.push({
        type: 'warning',
        title: '缺少起始節點',
        message: '建議添加 Webhook觸發 或 程式進入點 作為流程的起始節點',
        action: 'add-start-node'
      });
    }

    // 檢查配置不完整的節點
    const incompleteNodes = nodes.filter(node => {
      switch (node.data.type) {
        case 'http-request':
          return !node.data.url || !node.data.method;
        case 'condition':
          return !node.data.field || !node.data.operator || node.data.value === undefined;
        case 'line-reply':
        case 'line-push':
          return !node.data.body?.messages?.[0]?.text;
        case 'data-map':
          return !node.data.mappings || node.data.mappings.length === 0;
        default:
          return false;
      }
    });

    if (incompleteNodes.length > 0) {
      newHints.push({
        type: 'warning',
        title: '配置不完整',
        message: `發現 ${incompleteNodes.length} 個節點配置不完整，請檢查必填欄位`,
        action: 'check-config'
      });
    }

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

    // 檢查孤立節點（更準確的檢查）
    const isolatedNodes = nodes.filter(node => {
      // 檢查是否有連入的邊
      const hasIncoming = selectedNode?.edges?.some(edge => edge.target === node.id) || false;
      // 檢查是否有連出的邊  
      const hasOutgoing = selectedNode?.edges?.some(edge => edge.source === node.id) || false;
      // 起始節點不算孤立
      const isStartNode = node.data.type === 'webhook-trigger' || node.data.type === 'program-entry';
      
      return !hasIncoming && !hasOutgoing && !isStartNode;
    });

    if (isolatedNodes.length > 0) {
      newHints.push({
        type: 'info',
        title: '連接建議',
        message: `發現 ${isolatedNodes.length} 個未連接的節點，建議連接到流程中`,
        action: 'connect-nodes'
      });
    }

    // 檢查 LINE 節點的 Token 配置
    const lineNodes = nodes.filter(n => 
      n.data.type === 'line-reply' || n.data.type === 'line-push' || n.data.type === 'line-carousel'
    );
    
    lineNodes.forEach(node => {
      const authHeader = node.data.headers?.Authorization;
      if (!authHeader || authHeader === 'Bearer ' || authHeader.length < 20) {
        newHints.push({
          type: 'warning',
          title: 'LINE Token 設定',
          message: `節點 "${node.data.label}" 的 LINE Token 可能未正確設定`,
          nodeId: node.id,
          action: 'configure-token'
        });
      }
    });

    // 效能建議
    if (nodes.length > 10) {
      newHints.push({
        type: 'info',
        title: '效能建議',
        message: '流程節點較多，建議考慮使用子流程來組織複雜的邏輯',
        action: 'optimize-performance'
      });
    }

    // 最佳實踐建議
    const httpNodes = nodes.filter(n => n.data.type === 'http-request');
    if (httpNodes.length > 0) {
      const hasErrorHandling = nodes.some(n => n.data.type === 'condition');
      if (!hasErrorHandling) {
        newHints.push({
          type: 'info',
          title: '錯誤處理建議',
          message: '建議添加條件判斷節點來處理 API 呼叫可能的錯誤情況',
          action: 'add-error-handling'
        });
      }
    }

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
      case 'get-started':
        showNotification('info', '歡迎使用 FlowBuilder', '1. 從左側面板拖拽節點到畫布上\n2. 點擊節點進行配置\n3. 拖拽連接點建立流程');
        break;
      case 'add-start-node':
        showNotification('info', '建議添加起始節點', '• Webhook觸發：接收外部請求\n• 程式進入點：手動觸發流程');
        break;
      case 'check-config':
        showNotification('warning', '請檢查以下配置', '• HTTP請求：URL 和方法\n• 條件判斷：欄位、運算子、值\n• LINE節點：訊息內容\n• 資料映射：映射規則');
        break;
      case 'configure-params':
        if (hint.nodeId) {
          const node = nodes.find(n => n.id === hint.nodeId);
          if (node) {
            showNotification('info', `配置節點 "${node.data.label}" 參數映射`, '1. 點擊節點打開編輯器\n2. 設定輸入參數映射\n3. 配置輸出參數');
          }
        }
        break;
      case 'connect-nodes':
        showNotification('info', '連接節點步驟', '1. 將滑鼠移到節點邊緣\n2. 出現連接點時拖拽到目標節點\n3. 釋放完成連接');
        break;
      case 'configure-token':
        if (hint.nodeId) {
          showNotification('warning', 'LINE Token 設定', '1. 點擊節點打開編輯器\n2. 在 Authorization 欄位輸入 "Bearer YOUR_TOKEN"\n3. 或使用 Token 管理器統一管理');
        }
        break;
      case 'add-error-handling':
        showNotification('info', '錯誤處理建議', '1. 添加條件判斷節點\n2. 檢查 API 回應狀態\n3. 設定錯誤處理流程');
        break;
      case 'optimize-performance':
        showNotification('info', '效能優化建議', '1. 將相關節點組成子流程\n2. 使用現有流程節點引用\n3. 減少不必要的節點');
        break;
      case 'best-practice':
        showNotification('info', '最佳實踐', '1. 使用有意義的節點名稱\n2. 添加詳細的描述\n3. 定義清晰的輸入輸出參數');
        break;
      default:
        break;
    }
  }

  function getActionText(action) {
    switch (action) {
      case 'get-started': return '開始使用';
      case 'add-start-node': return '添加起始節點';
      case 'check-config': return '檢查配置';
      case 'configure-params': return '配置參數';
      case 'connect-nodes': return '了解連接';
      case 'configure-token': return '設定 Token';
      case 'add-error-handling': return '添加錯誤處理';
      case 'optimize-performance': return '優化效能';
      case 'best-practice': return '查看建議';
      default: return '處理';
    }
  }
}

export default SmartHints;