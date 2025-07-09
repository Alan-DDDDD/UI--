import React, { useState, useEffect } from 'react';

function NodeEditor({ selectedNode, onUpdateNode, onClose }) {
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setConfig({ ...selectedNode.data });
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleSave = () => {
    const updatedConfig = { ...config };
    
    // 處理自定義資料
    if (config.useDataFrom === 'custom' && config.customData) {
      try {
        updatedConfig.body = JSON.parse(config.customData);
      } catch (e) {
        alert('資料格式錯誤，請輸入正確的JSON格式');
        return;
      }
    }
    
    // 更新標籤
    if (selectedNode.data.type === 'http-request') {
      updatedConfig.label = config.name || `${config.method} 請求`;
    } else if (selectedNode.data.type === 'notification') {
      updatedConfig.label = `通知：${config.message}`;
    } else if (selectedNode.data.type === 'data-map') {
      updatedConfig.label = config.name || '資料映射';
    }
    
    onUpdateNode(selectedNode.id, updatedConfig);
    onClose();
  };

  const renderEditor = () => {
    const nodeType = selectedNode.data.type;

    switch (nodeType) {
      case 'http-request':
        const isLineAPI = config.url && config.url.includes('api.line.me');
        
        if (isLineAPI) {
          const isReply = config.url.includes('/reply');
          return (
            <div>
              <h4>📱 編輯LINE{isReply ? '回覆' : '推送'}</h4>
              <input 
                placeholder="動作名稱"
                value={config.name || ''}
                onChange={(e) => setConfig({...config, name: e.target.value})}
              />
              <input 
                placeholder="Channel Access Token"
                value={config.headers?.Authorization?.replace('Bearer ', '') || ''}
                onChange={(e) => setConfig({
                  ...config, 
                  headers: {
                    ...config.headers,
                    'Authorization': `Bearer ${e.target.value}`
                  }
                })}
                type="password"
              />
              {isReply ? (
                <input 
                  placeholder="Reply Token"
                  value={config.body?.replyToken || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    body: {
                      ...config.body,
                      replyToken: e.target.value
                    }
                  })}
                />
              ) : (
                <input 
                  placeholder="用戶ID"
                  value={config.body?.to || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    body: {
                      ...config.body,
                      to: e.target.value
                    }
                  })}
                />
              )}
              <textarea 
                placeholder="訊息內容"
                value={config.body?.messages?.[0]?.text || ''}
                onChange={(e) => setConfig({
                  ...config,
                  body: {
                    ...config.body,
                    messages: [{
                      type: 'text',
                      text: e.target.value
                    }]
                  }
                })}
                rows={3}
              />
            </div>
          );
        }
        
        return (
          <div>
            <h4>🌐 編輯API呼叫</h4>
            <input 
              placeholder="動作名稱"
              value={config.name || ''}
              onChange={(e) => setConfig({...config, name: e.target.value})}
            />
            <select 
              value={config.method || 'GET'}
              onChange={(e) => setConfig({...config, method: e.target.value})}
            >
              <option value="GET">取得資料 (GET)</option>
              <option value="POST">新增資料 (POST)</option>
              <option value="PUT">更新資料 (PUT)</option>
              <option value="DELETE">刪除資料 (DELETE)</option>
            </select>
            <input 
              placeholder="API網址"
              value={config.url || ''}
              onChange={(e) => setConfig({...config, url: e.target.value})}
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              💡 提示：可使用 {'{'}id{'}'} 來引用前一步的資料欄位
            </small>
            <div style={{margin: '10px 0'}}>
              <label>📦 要發送的資料：</label>
              <select 
                value={config.useDataFrom || 'none'}
                onChange={(e) => setConfig({...config, useDataFrom: e.target.value})}
              >
                <option value="none">不發送資料</option>
                <option value="previous">使用前一步的結果</option>
                <option value="custom">自定義資料</option>
              </select>
            </div>
            {config.useDataFrom === 'custom' && (
              <textarea 
                placeholder='{"name": "test", "age": 25}'
                value={typeof config.body === 'object' ? JSON.stringify(config.body, null, 2) : (config.customData || '')}
                onChange={(e) => setConfig({...config, customData: e.target.value})}
                rows={3}
              />
            )}
          </div>
        );

      case 'condition':
        return (
          <div>
            <h4>❓ 編輯條件檢查</h4>
            <select 
              value={getConditionType(config.condition)}
              onChange={(e) => {
                const conditions = {
                  success: '$prev.success === true',
                  failed: '$prev.success === false',
                  error400: '$prev.error && $prev.error.includes("400")',
                  error500: '$prev.error && $prev.error.includes("500")'
                };
                setConfig({...config, condition: conditions[e.target.value]});
              }}
            >
              <option value="success">✅ 前一步執行成功</option>
              <option value="failed">❌ 前一步執行失敗</option>
              <option value="error400">⚠️ 發生400錯誤</option>
              <option value="error500">🚨 發生500錯誤</option>
            </select>
          </div>
        );

      case 'notification':
        return (
          <div>
            <h4>📢 編輯顯示訊息</h4>
            <input 
              placeholder="要顯示的訊息"
              value={config.message || ''}
              onChange={(e) => setConfig({...config, message: e.target.value})}
            />
          </div>
        );

      case 'data-map':
        return (
          <div>
            <h4>🔄 編輯資料映射</h4>
            <input 
              placeholder="映射名稱"
              value={config.name || ''}
              onChange={(e) => setConfig({...config, name: e.target.value})}
            />
            <div style={{margin: '10px 0'}}>
              <strong>欄位對應：</strong>
              {(config.mappings || []).map((mapping, index) => (
                <div key={index} style={{display: 'flex', gap: '5px', margin: '5px 0'}}>
                  <input 
                    placeholder="來源欄位"
                    value={mapping.from}
                    onChange={(e) => {
                      const newMappings = [...(config.mappings || [])];
                      newMappings[index].from = e.target.value;
                      setConfig({...config, mappings: newMappings});
                    }}
                    style={{flex: 1}}
                  />
                  <span>→</span>
                  <input 
                    placeholder="目標欄位"
                    value={mapping.to}
                    onChange={(e) => {
                      const newMappings = [...(config.mappings || [])];
                      newMappings[index].to = e.target.value;
                      setConfig({...config, mappings: newMappings});
                    }}
                    style={{flex: 1}}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>未知的節點類型</div>;
    }
  };

  const getConditionType = (condition) => {
    if (condition === '$prev.success === true') return 'success';
    if (condition === '$prev.success === false') return 'failed';
    if (condition && condition.includes('400')) return 'error400';
    if (condition && condition.includes('500')) return 'error500';
    return 'success';
  };

  return (
    <div className="node-editor-overlay">
      <div className="node-editor">
        <div className="node-editor-header">
          <h3>⚙️ 編輯節點</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="node-editor-content">
          {renderEditor()}
        </div>
        <div className="node-editor-footer">
          <button onClick={handleSave} className="save-btn">💾 儲存</button>
          <button onClick={onClose} className="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  );
}

export default NodeEditor;