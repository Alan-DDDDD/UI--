import React from 'react';

function ExecutionProgress({ isExecuting, currentStep, totalSteps, stepName }) {
  if (!isExecuting) return null;

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="execution-progress-overlay">
      <div className="execution-progress-dialog">
        <div className="progress-header">
          <h3>🚀 執行中...</h3>
          <div className="progress-stats">
            步驟 {currentStep} / {totalSteps}
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-percentage">
            {Math.round(progress)}%
          </div>
        </div>
        
        {stepName && (
          <div className="current-step">
            <div className="step-icon">⚙️</div>
            <div className="step-name">{stepName}</div>
          </div>
        )}
        
        <div className="progress-animation">
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  );
}

export default ExecutionProgress;