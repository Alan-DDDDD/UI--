import React, { useState, useEffect } from 'react';

function WorkflowStatus({ nodes, edges, workflowId, hasUnsavedChanges }) {
  const [status, setStatus] = useState({
    health: 'unknown',
    issues: [],
    stats: {
      totalNodes: 0,
      connectedNodes: 0,
      workflowRefs: 0,
      missingParams: 0
    }
  });

  useEffect(() => {
    analyzeWorkflow();
  }, [nodes, edges]);

  const analyzeWorkflow = () => {
    const issues = [];
    const stats = {
      totalNodes: nodes.length,
      connectedNodes: 0,
      workflowRefs: 0,
      missingParams: 0
    };

    // 分析節點連接狀況
    const connectedNodeIds = new Set();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    stats.connectedNodes = connectedNodeIds.size;

    // 檢查孤立節點
    const isolatedNodes = nodes.filter(node => 
      !connectedNodeIds.has(node.id) && 
      node.data.type !== 'webhook-trigger'
    );
    
    if (isolatedNodes.length > 0) {
      issues.push({
        type: 'warning',
        message: `發現 ${isolatedNodes.length} 個孤立節點`,
        severity: 'medium'
      });
    }

    // 分析workflow-reference節點
    const workflowRefNodes = nodes.filter(n => 
      n.data.type === 'existing-workflow' || n.data.type === 'workflow-reference'
    );
    stats.workflowRefs = workflowRefNodes.length;

    // 檢查參數映射
    workflowRefNodes.forEach(node => {
      if (!node.data.paramMappings || node.data.paramMappings.length === 0) {
        stats.missingParams++;
        issues.push({
          type: 'warning',
          message: `節點 "${node.data.label}" 缺少參數映射`,
          severity: 'medium'
        });
      }
    });

    // 檢查是否有起始節點
    const hasWebhookTrigger = nodes.some(n => n.data.type === 'webhook-trigger');
    if (!hasWebhookTrigger && nodes.length > 0) {
      issues.push({
        type: 'info',
        message: '建議添加 Webhook 觸發節點作為流程起點',
        severity: 'low'
      });
    }

    // 計算整體健康狀況
    let health = 'good';
    const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
    const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length;

    if (highSeverityIssues > 0) {
      health = 'critical';
    } else if (mediumSeverityIssues > 2) {
      health = 'warning';
    } else if (mediumSeverityIssues > 0 || issues.length > 0) {
      health = 'caution';
    }

    setStatus({ health, issues, stats });
  };

  const getHealthIcon = () => {
    switch (status.health) {
      case 'good': return '✅';
      case 'caution': return '⚠️';
      case 'warning': return '🟡';
      case 'critical': return '❌';
      default: return '❓';
    }
  };

  const getHealthColor = () => {
    switch (status.health) {
      case 'good': return '#4CAF50';
      case 'caution': return '#FF9800';
      case 'warning': return '#FFC107';
      case 'critical': return '#dc3545';
      default: return '#666';
    }
  };

  const getHealthText = () => {
    switch (status.health) {
      case 'good': return '流程狀態良好';
      case 'caution': return '需要注意';
      case 'warning': return '發現問題';
      case 'critical': return '嚴重問題';
      default: return '分析中...';
    }
  };

  return (
    <div className="workflow-status-panel">
      <div className="status-header">
        <div className="status-indicator">
          <span className="status-icon">{getHealthIcon()}</span>
          <span 
            className="status-text"
            style={{ color: getHealthColor() }}
          >
            {getHealthText()}
          </span>
        </div>
        
        {hasUnsavedChanges && (
          <div className="unsaved-indicator">
            <span className="unsaved-dot"></span>
            <span>未儲存</span>
          </div>
        )}
      </div>

      <div className="status-stats">
        <div className="stat-item">
          <span className="stat-value">{status.stats.totalNodes}</span>
          <span className="stat-label">節點</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{status.stats.connectedNodes}</span>
          <span className="stat-label">已連接</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{status.stats.workflowRefs}</span>
          <span className="stat-label">子流程</span>
        </div>
      </div>

      {status.issues.length > 0 && (
        <div className="status-issues">
          <div className="issues-header">
            <span>發現 {status.issues.length} 個問題</span>
          </div>
          <div className="issues-list">
            {status.issues.slice(0, 3).map((issue, index) => (
              <div key={index} className={`issue-item issue-${issue.type}`}>
                <span className="issue-icon">
                  {issue.type === 'warning' ? '⚠️' : 
                   issue.type === 'error' ? '❌' : '💡'}
                </span>
                <span className="issue-text">{issue.message}</span>
              </div>
            ))}
            {status.issues.length > 3 && (
              <div className="more-issues">
                還有 {status.issues.length - 3} 個問題...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowStatus;