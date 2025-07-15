import React, { useState } from 'react';

function WorkflowSettings({ 
  isOpen, 
  onClose, 
  workflowName, 
  onWorkflowNameChange,
  inputParams = [], 
  outputParams = [], 
  onParamsChange 
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [localWorkflowName, setLocalWorkflowName] = useState(workflowName);

  if (!isOpen) return null;

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

  const handleSave = () => {
    onWorkflowNameChange(localWorkflowName);
    onClose();
  };

  return (
    <div className="workflow-settings-overlay">
      <div className="workflow-settings-dialog">
        <div className="settings-header">
          <h3>⚙️ 流程設定</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="settings-tabs">
          <button 
            className={activeTab === 'basic' ? 'active' : ''}
            onClick={() => setActiveTab('basic')}
          >
            📋 基本設定
          </button>
          <button 
            className={activeTab === 'params' ? 'active' : ''}
            onClick={() => setActiveTab('params')}
          >
            ⚙️ 參數設定
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'basic' && (
            <div className="basic-settings">
              <div className="setting-group">
                <label>流程名稱：</label>
                <input
                  value={localWorkflowName}
                  onChange={(e) => setLocalWorkflowName(e.target.value)}
                  placeholder="請輸入流程名稱"
                />
              </div>
              
              <div className="setting-group">
                <label>參數統計：</label>
                <div className="param-stats">
                  <span>📥 輸入參數: {inputParams.length} 個</span>
                  <span>📤 輸出參數: {outputParams.length} 個</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'params' && (
            <div className="params-settings">
              <div className="param-section">
                <div className="param-section-header">
                  <h4>📥 輸入參數</h4>
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
                  <div className="empty-params">尚未定義輸入參數</div>
                )}
              </div>

              <div className="param-section">
                <div className="param-section-header">
                  <h4>📤 輸出參數</h4>
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
                  <div className="empty-params">尚未定義輸出參數</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button onClick={handleSave} className="save-btn">💾 儲存</button>
          <button onClick={onClose} className="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  );
}

export default WorkflowSettings;