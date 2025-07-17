import React, { useState } from 'react';
import './ExecuteDialog.css';

function ExecuteDialog({ isOpen, onClose, onExecute, inputParams = [] }) {
  const [inputData, setInputData] = useState({});

  if (!isOpen) return null;

  const handleInputChange = (paramName, value) => {
    setInputData(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleExecute = () => {
    onExecute(inputData);
    onClose();
    setInputData({});
  };

  return (
    <div className="execute-dialog-overlay">
      <div className="execute-dialog">
        <div className="dialog-header">
          <h3>🚀 執行流程</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="dialog-content">
          {inputParams.length > 0 ? (
            <>
              <p>請輸入執行參數：</p>
              <div className="input-params">
                {inputParams.map(param => (
                  <div key={param.name} className="param-item">
                    <label>
                      {param.name}
                      {param.required && <span className="required">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder={param.description || `輸入 ${param.name}`}
                      value={inputData[param.name] || ''}
                      onChange={(e) => handleInputChange(param.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>此流程不需要輸入參數，直接執行。</p>
          )}
        </div>
        
        <div className="dialog-buttons">
          <button onClick={handleExecute} className="execute-btn">
            ▶️ 開始執行
          </button>
          <button onClick={onClose} className="cancel-btn">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExecuteDialog;