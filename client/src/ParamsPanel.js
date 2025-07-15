import React, { useState } from 'react';

function ParamsPanel({ inputParams = [], outputParams = [], onParamsChange, compact = false }) {
  const [activeTab, setActiveTab] = useState('input');

  const addInputParam = () => {
    const newParam = {
      id: Date.now().toString(),
      name: '',
      type: 'string',
      required: false,
      defaultValue: '',
      description: ''
    };
    onParamsChange([...inputParams, newParam], outputParams);
  };

  const addOutputParam = () => {
    const newParam = {
      id: Date.now().toString(),
      name: '',
      type: 'string',
      description: ''
    };
    onParamsChange(inputParams, [...outputParams, newParam]);
  };

  const updateInputParam = (index, field, value) => {
    const updated = [...inputParams];
    updated[index] = { ...updated[index], [field]: value };
    onParamsChange(updated, outputParams);
  };

  const updateOutputParam = (index, field, value) => {
    const updated = [...outputParams];
    updated[index] = { ...updated[index], [field]: value };
    onParamsChange(inputParams, updated);
  };

  const removeInputParam = (index) => {
    const updated = inputParams.filter((_, i) => i !== index);
    onParamsChange(updated, outputParams);
  };

  const removeOutputParam = (index) => {
    const updated = outputParams.filter((_, i) => i !== index);
    onParamsChange(inputParams, updated);
  };

  if (compact) {
    return (
      <div className="params-panel compact">
        <div className="param-count">
          📥 {inputParams.length} | 📤 {outputParams.length}
        </div>
      </div>
    );
  }

  return (
    <div className="params-panel">
      <h3>⚙️ 流程參數</h3>
      
      <div className="param-tabs">
        <button 
          className={activeTab === 'input' ? 'active' : ''}
          onClick={() => setActiveTab('input')}
        >
          📥 輸入參數 ({inputParams.length})
        </button>
        <button 
          className={activeTab === 'output' ? 'active' : ''}
          onClick={() => setActiveTab('output')}
        >
          📤 輸出參數 ({outputParams.length})
        </button>
      </div>

      {activeTab === 'input' && (
        <div className="param-section">
          <div className="param-header">
            <span>定義此流程需要的輸入參數</span>
            <button onClick={addInputParam} className="add-param-btn">+ 新增</button>
          </div>
          
          {inputParams.map((param, index) => (
            <div key={param.id} className="param-item">
              <div className="param-row">
                <input
                  placeholder="參數名稱"
                  value={param.name}
                  onChange={(e) => updateInputParam(index, 'name', e.target.value)}
                  className="param-name"
                />
                <select
                  value={param.type}
                  onChange={(e) => updateInputParam(index, 'type', e.target.value)}
                  className="param-type"
                >
                  <option value="string">文字</option>
                  <option value="number">數字</option>
                  <option value="boolean">布林</option>
                  <option value="object">物件</option>
                </select>
                <label className="param-required">
                  <input
                    type="checkbox"
                    checked={param.required}
                    onChange={(e) => updateInputParam(index, 'required', e.target.checked)}
                  />
                  必要
                </label>
                <button 
                  onClick={() => removeInputParam(index)}
                  className="remove-param-btn"
                >
                  ✕
                </button>
              </div>
              <input
                placeholder="預設值"
                value={param.defaultValue}
                onChange={(e) => updateInputParam(index, 'defaultValue', e.target.value)}
                className="param-default"
              />
              <input
                placeholder="參數描述"
                value={param.description}
                onChange={(e) => updateInputParam(index, 'description', e.target.value)}
                className="param-desc"
              />
            </div>
          ))}
          
          {inputParams.length === 0 && (
            <div className="empty-params">
              此流程尚未定義輸入參數
            </div>
          )}
        </div>
      )}

      {activeTab === 'output' && (
        <div className="param-section">
          <div className="param-header">
            <span>定義此流程會返回的輸出參數</span>
            <button onClick={addOutputParam} className="add-param-btn">+ 新增</button>
          </div>
          
          {outputParams.map((param, index) => (
            <div key={param.id} className="param-item">
              <div className="param-row">
                <input
                  placeholder="參數名稱"
                  value={param.name}
                  onChange={(e) => updateOutputParam(index, 'name', e.target.value)}
                  className="param-name"
                />
                <select
                  value={param.type}
                  onChange={(e) => updateOutputParam(index, 'type', e.target.value)}
                  className="param-type"
                >
                  <option value="string">文字</option>
                  <option value="number">數字</option>
                  <option value="boolean">布林</option>
                  <option value="object">物件</option>
                </select>
                <button 
                  onClick={() => removeOutputParam(index)}
                  className="remove-param-btn"
                >
                  ✕
                </button>
              </div>
              <input
                placeholder="參數描述"
                value={param.description}
                onChange={(e) => updateOutputParam(index, 'description', e.target.value)}
                className="param-desc"
              />
            </div>
          ))}
          
          {outputParams.length === 0 && (
            <div className="empty-params">
              此流程尚未定義輸出參數
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ParamsPanel;