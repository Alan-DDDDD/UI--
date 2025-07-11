import React, { useState, useEffect } from 'react';
import axios from 'axios';

function NodeEditor({ selectedNode, onUpdateNode, onDeleteNode, onClose }) {
  const [config, setConfig] = useState({});
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    if (selectedNode) {
      setConfig({ ...selectedNode.data });
    }
    loadTokens();
  }, [selectedNode]);

  const loadTokens = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/tokens');
      setTokens(response.data.tokens);
    } catch (error) {
      console.error('載入 Token 失敗:', error);
    }
  };

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
    if (selectedNode.data.type === 'http-request' || selectedNode.data.type === 'line-push' || selectedNode.data.type === 'line-reply') {
      updatedConfig.label = config.name || config.label || `${config.method} 請求`;
    } else if (selectedNode.data.type === 'notification') {
      updatedConfig.label = `通知：${config.message}`;
    } else if (selectedNode.data.type === 'data-map') {
      updatedConfig.label = config.name || '資料映射';
    } else if (selectedNode.data.type === 'webhook-trigger') {
      updatedConfig.label = config.name || 'Webhook觸發';
    }
    
    // 確保LINE節點有正確的useDataFrom設定
    if (selectedNode.data.type === 'line-push' || selectedNode.data.type === 'line-reply') {
      updatedConfig.useDataFrom = 'custom';
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
              <label>🔑 Headers：</label>
              <textarea 
                placeholder='{
  "Authorization": "Bearer {tokenName}",
  "Content-Type": "application/json"
}'
                value={typeof config.headers === 'object' ? JSON.stringify(config.headers, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value || '{}');
                    setConfig({...config, headers});
                  } catch (err) {
                    // 如果 JSON 無效，保持原值
                  }
                }}
                rows={4}
              />
              <small style={{color: '#666', fontSize: '12px'}}>
                💡 可使用 {'{'}tokenName{'}'} 引用已儲存的 Token
              </small>
            </div>
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
            <div style={{marginBottom: '10px'}}>
              <label>判斷欄位：</label>
              <input 
                placeholder="例如: {message} 或 {userId}"
                value={config.field || ''}
                onChange={(e) => setConfig({...config, field: e.target.value})}
              />
            </div>
            <div style={{marginBottom: '10px'}}>
              <label>判斷條件：</label>
              <select 
                value={config.operator || '=='}
                onChange={(e) => setConfig({...config, operator: e.target.value})}
              >
                <option value="==">等於</option>
                <option value="!=">不等於</option>
                <option value="contains">包含</option>
                <option value="not_contains">不包含</option>
                <option value=">">&gt; 大於</option>
                <option value="<">&lt; 小於</option>
                <option value=">=">&gt;= 大於等於</option>
                <option value="<=">&lt;= 小於等於</option>
              </select>
            </div>
            <div style={{marginBottom: '10px'}}>
              <label>比較值：</label>
              <input 
                placeholder="要比較的值"
                value={config.value || ''}
                onChange={(e) => setConfig({...config, value: e.target.value})}
              />
            </div>
            <small style={{color: '#666', fontSize: '12px'}}>
              💡 範例：欄位填 {'{'}message{'}'}, 條件選「包含」, 值填「你好」
            </small>
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
              {(config.mappings || [{from: '', to: ''}]).map((mapping, index) => (
                <div key={index} className="mapping-row">
                  <input 
                    placeholder="來源欄位"
                    value={mapping.from || ''}
                    onChange={(e) => {
                      const newMappings = [...(config.mappings || [{from: '', to: ''}])];
                      newMappings[index] = {...newMappings[index], from: e.target.value};
                      setConfig({...config, mappings: newMappings});
                    }}
                    className="mapping-input"
                  />
                  <span className="mapping-arrow">→</span>
                  <input 
                    placeholder="目標欄位"
                    value={mapping.to || ''}
                    onChange={(e) => {
                      const newMappings = [...(config.mappings || [{from: '', to: ''}])];
                      newMappings[index] = {...newMappings[index], to: e.target.value};
                      setConfig({...config, mappings: newMappings});
                    }}
                    className="mapping-input"
                  />
                  {(config.mappings || []).length > 1 && (
                    <button 
                      onClick={() => {
                        const newMappings = (config.mappings || []).filter((_, i) => i !== index);
                        setConfig({...config, mappings: newMappings});
                      }}
                      className="remove-mapping-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button 
                onClick={() => {
                  const newMappings = [...(config.mappings || []), {from: '', to: ''}];
                  setConfig({...config, mappings: newMappings});
                }}
                className="add-mapping-btn"
              >
                + 新增對應
              </button>
            </div>
          </div>
        );
      
      case 'line-push':
        return (
          <div>
            <h4>📱 編輯LINE推送</h4>
            <input 
              placeholder="動作名稱"
              value={config.name || config.label || ''}
              onChange={(e) => setConfig({...config, name: e.target.value, label: e.target.value})}
            />
            <select
              value={config.lineAccount || ''}
              onChange={(e) => setConfig({
                ...config,
                lineAccount: e.target.value,
                headers: {
                  'Authorization': `Bearer {${e.target.value}}`,
                  'Content-Type': 'application/json'
                }
              })}
            >
              <option value="">選擇 LINE@ 帳號</option>
              {tokens.map(token => (
                <option key={token.key} value={token.key}>
                  {token.name}
                </option>
              ))}
            </select>
            <input 
              placeholder="用戶ID (可用{userId}引用)"
              value={config.body?.to || ''}
              onChange={(e) => setConfig({
                ...config,
                body: {
                  to: e.target.value,
                  messages: [{
                    type: 'text',
                    text: config.body?.messages?.[0]?.text || ''
                  }]
                }
              })}
            />
            <textarea 
              placeholder="訊息內容"
              value={config.body?.messages?.[0]?.text || ''}
              onChange={(e) => setConfig({
                ...config,
                body: {
                  to: config.body?.to || '',
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
      
      case 'line-reply':
        return (
          <div>
            <h4>💬 編輯LINE回覆</h4>
            <input 
              placeholder="動作名稱"
              value={config.name || config.label || ''}
              onChange={(e) => setConfig({...config, name: e.target.value, label: e.target.value})}
            />
            <select
              value={config.lineAccount || ''}
              onChange={(e) => setConfig({
                ...config,
                lineAccount: e.target.value,
                headers: {
                  'Authorization': `Bearer {${e.target.value}}`,
                  'Content-Type': 'application/json'
                }
              })}
            >
              <option value="">選擇 LINE@ 帳號</option>
              {tokens.map(token => (
                <option key={token.key} value={token.key}>
                  {token.name}
                </option>
              ))}
            </select>
            <input 
              placeholder="Reply Token (可用{replyToken}引用)"
              value={config.body?.replyToken || ''}
              onChange={(e) => setConfig({
                ...config,
                body: {
                  replyToken: e.target.value,
                  messages: [{
                    type: 'text',
                    text: config.body?.messages?.[0]?.text || ''
                  }]
                }
              })}
            />
            <textarea 
              placeholder="回覆內容"
              value={config.body?.messages?.[0]?.text || ''}
              onChange={(e) => setConfig({
                ...config,
                body: {
                  replyToken: config.body?.replyToken || '',
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
      
      case 'line-carousel':
        return (
          <div>
            <h4>🎠 編輯LINE多頁訊息</h4>
            <input 
              placeholder="動作名稱"
              value={config.name || config.label || ''}
              onChange={(e) => setConfig({...config, name: e.target.value, label: e.target.value})}
            />
            <select
              value={config.lineAccount || ''}
              onChange={(e) => setConfig({
                ...config,
                lineAccount: e.target.value,
                headers: {
                  'Authorization': `Bearer {${e.target.value}}`,
                  'Content-Type': 'application/json'
                }
              })}
            >
              <option value="">選擇 LINE@ 帳號</option>
              {tokens.map(token => (
                <option key={token.key} value={token.key}>
                  {token.name}
                </option>
              ))}
            </select>
            <div style={{margin: '10px 0'}}>
              <label>訊息類型：</label>
              <select 
                value={config.messageType || 'reply'}
                onChange={(e) => {
                  const isReply = e.target.value === 'reply';
                  setConfig({
                    ...config, 
                    messageType: e.target.value,
                    body: {
                      ...config.body,
                      ...(isReply ? {replyToken: '{replyToken}'} : {to: '{userId}'})
                    }
                  });
                }}
              >
                <option value="reply">回覆訊息</option>
                <option value="push">推送訊息</option>
              </select>
            </div>
            <div style={{margin: '10px 0'}}>
              <label>範本類型：</label>
              <select 
                value={config.templateType || 'carousel'}
                onChange={(e) => {
                  const templates = {
                    carousel: {
                      type: 'carousel',
                      columns: [{
                        title: '標题1',
                        text: '內容1',
                        actions: [{type: 'message', label: '選擇1', text: '選擇1'}]
                      }]
                    },
                    buttons: {
                      type: 'buttons',
                      text: '請選擇一個選項',
                      actions: [
                        {type: 'message', label: '選擇1', text: '選擇1'},
                        {type: 'message', label: '選擇2', text: '選擇2'}
                      ]
                    },
                    confirm: {
                      type: 'confirm',
                      text: '確定要執行這個操作嗎？',
                      actions: [
                        {type: 'message', label: '是', text: '確定'},
                        {type: 'message', label: '否', text: '取消'}
                      ]
                    },
                    imagemap: {
                      type: 'imagemap',
                      baseUrl: 'https://developers.line.biz/assets/img/messaging-api/imagemap/sample',
                      baseSize: {width: 1040, height: 1040},
                      actions: [
                        {type: 'message', area: {x: 0, y: 0, width: 520, height: 520}, text: '左上'},
                        {type: 'message', area: {x: 520, y: 0, width: 520, height: 520}, text: '右上'},
                        {type: 'message', area: {x: 0, y: 520, width: 520, height: 520}, text: '左下'},
                        {type: 'message', area: {x: 520, y: 520, width: 520, height: 520}, text: '右下'}
                      ]
                    }
                  };
                  setConfig({
                    ...config,
                    templateType: e.target.value,
                    body: {
                      ...config.body,
                      messages: [{
                        type: 'template',
                        altText: templates[e.target.value].altText || '範本訊息',
                        template: templates[e.target.value]
                      }]
                    }
                  });
                }}
              >
                <option value="carousel">🎠 輪播卡片 (Carousel)</option>
                <option value="buttons">🔘 按鈕範本 (Buttons)</option>
                <option value="confirm">❓ 確認範本 (Confirm)</option>
                <option value="imagemap">🗺️ 圖片地圖 (Imagemap)</option>
              </select>
            </div>
            <textarea 
              placeholder={getTemplatePlaceholder(config.templateType || 'carousel')}
              value={typeof config.body?.messages?.[0]?.template === 'object' ? 
                JSON.stringify(config.body.messages[0].template, null, 2) : ''}
              onChange={(e) => {
                try {
                  const template = JSON.parse(e.target.value);
                  setConfig({
                    ...config,
                    body: {
                      ...config.body,
                      messages: [{
                        type: 'template',
                        altText: template.altText || '多頁訊息',
                        template
                      }]
                    }
                  });
                } catch (err) {
                  // JSON 無效時不更新
                }
              }}
              rows={10}
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              {getTemplateHint(config.templateType || 'carousel')}
            </small>
          </div>
        );
      
      case 'webhook-trigger':
        return (
          <div>
            <h4>🔗 編輯Webhook觸發</h4>
            <input 
              placeholder="觸發名稱"
              value={config.name || ''}
              onChange={(e) => setConfig({...config, name: e.target.value})}
            />
            <textarea 
              placeholder="描述這個webhook的用途"
              value={config.description || ''}
              onChange={(e) => setConfig({...config, description: e.target.value})}
              rows={2}
            />
          </div>
        );

      default:
        return (
          <div>
            <h4>編輯節點</h4>
            <p>節點類型: {selectedNode.data.type}</p>
            <input 
              placeholder="節點名稱"
              value={config.name || config.label || ''}
              onChange={(e) => setConfig({...config, name: e.target.value, label: e.target.value})}
            />
          </div>
        );
    }
  };

  const getConditionType = (condition) => {
    if (condition === '$prev.success === true') return 'success';
    if (condition === '$prev.success === false') return 'failed';
    if (condition && condition.includes('400')) return 'error400';
    if (condition && condition.includes('500')) return 'error500';
    return 'success';
  };

  const getTemplatePlaceholder = (templateType) => {
    const templates = {
      carousel: `{
  "type": "carousel",
  "columns": [
    {
      "title": "商品1",
      "text": "商品描述",
      "thumbnailImageUrl": "https://example.com/image1.jpg",
      "actions": [
        {"type": "message", "label": "購買", "text": "購買商品1"},
        {"type": "uri", "label": "詳情", "uri": "https://example.com"}
      ]
    }
  ]
}`,
      buttons: `{
  "type": "buttons",
  "text": "請選擇一個選項",
  "thumbnailImageUrl": "https://example.com/image.jpg",
  "actions": [
    {"type": "message", "label": "選擇1", "text": "選擇1"},
    {"type": "message", "label": "選擇2", "text": "選擇2"},
    {"type": "uri", "label": "網站", "uri": "https://example.com"}
  ]
}`,
      confirm: `{
  "type": "confirm",
  "text": "確定要刪除這筆資料嗎？",
  "actions": [
    {"type": "message", "label": "確定", "text": "確定刪除"},
    {"type": "message", "label": "取消", "text": "取消操作"}
  ]
}`,
      imagemap: `{
  "type": "imagemap",
  "baseUrl": "https://example.com/bot/images/rm001",
  "altText": "點擊圖片互動",
  "baseSize": {"width": 1040, "height": 1040},
  "actions": [
    {"type": "postback", "area": {"x": 0, "y": 0, "width": 520, "height": 1040}, "data": "action=buy&itemid=123"},
    {"type": "message", "area": {"x": 520, "y": 0, "width": 520, "height": 1040}, "text": "查看詳情"}
  ]
}`
    };
    return templates[templateType] || templates.carousel;
  };

  const getTemplateHint = (templateType) => {
    const hints = {
      carousel: '💡 Carousel: 最多 10 個卡片，每個卡片最多 3 個按鈕',
      buttons: '💡 Buttons: 最多 4 個按鈕，可加入圖片',
      confirm: '💡 Confirm: 固定 2 個按鈕（是/否）',
      imagemap: '💡 Imagemap: 在圖片上設定可點擊區域'
    };
    return hints[templateType] || hints.carousel;
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
          <button 
            onClick={() => {
              if (window.confirm('確定要刪除這個節點嗎？')) {
                onDeleteNode(selectedNode.id);
                onClose();
              }
            }} 
            className="delete-btn"
          >
            🗑️ 刪除
          </button>
        </div>
      </div>
    </div>
  );
}

export default NodeEditor;