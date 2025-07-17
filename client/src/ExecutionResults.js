import React from 'react';
import './ExecutionResults.css';

function ExecutionResults({ isOpen, onClose, results, nodes }) {
  if (!isOpen || !results) return null;

  const getNodeName = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || node?.data?.name || nodeId;
  };

  const getStepIcon = (success) => {
    return success ? '✅' : '❌';
  };

  const getStepStatus = (success) => {
    return success ? '成功' : '失敗';
  };

  return (
    <div className="execution-results-overlay">
      <div className="execution-results-panel">
        <div className="results-header">
          <h3>📊 執行結果</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="results-summary">
          <div className="summary-stats">
            <span className="total-steps">總步驟: {results.length}</span>
            <span className="success-steps">成功: {results.filter(r => r.result.success).length}</span>
            <span className="failed-steps">失敗: {results.filter(r => !r.result.success).length}</span>
          </div>
        </div>

        <div className="results-list">
          {results.map((step, index) => (
            <div key={step.nodeId} className={`result-item ${step.result.success ? 'success' : 'failed'}`}>
              <div className="step-header">
                <span className="step-title">
                  {getStepIcon(step.result.success)} 步驟 {index + 1} {step.result.success ? '執行成功' : '執行失敗'}
                </span>
              </div>
              
              <div className="step-details">
                <div className="node-name">{getNodeName(step.nodeId)}</div>
                {step.result.error && (
                  <div className="error-message">
                    <div className="error-title">錯誤詳情：</div>
                    <div className="error-content">{step.result.error}</div>
                    {step.result.details && (
                      <div className="error-details">
                        <div className="error-subtitle">額外資訊：</div>
                        <pre>{JSON.stringify(step.result.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
                {step.result.success && step.result.data && (
                  <div className="success-data">
                    {step.result.data.message || step.result.data.type || '執行完成'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExecutionResults;