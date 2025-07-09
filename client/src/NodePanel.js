import React, { useState } from 'react';
import DataMapPanel from './DataMapPanel';

function NodePanel({ onAddNode }) {
  const [httpConfig, setHttpConfig] = useState({ 
    url: '', 
    method: 'GET', 
    name: '', 
    useDataFrom: 'none',
    customData: ''
  });
  const [conditionType, setConditionType] = useState('success');
  const [notificationConfig, setNotificationConfig] = useState({ message: '' });
  const [lineConfig, setLineConfig] = useState({ 
    type: 'push', 
    name: '', 
    accessToken: '', 
    userId: '', 
    message: '',
    replyToken: ''
  });
  const [webhookConfig, setWebhookConfig] = useState({ name: '', description: '' });

  const addHttpNode = () => {
    const name = httpConfig.name || `${httpConfig.method} 請求`;
    const nodeData = {
      label: name,
      url: httpConfig.url,
      method: httpConfig.method,
      name,
      useDataFrom: httpConfig.useDataFrom
    };
    
    if (httpConfig.useDataFrom === 'custom' && httpConfig.customData) {
      try {
        nodeData.body = JSON.parse(httpConfig.customData);
      } catch (e) {
        alert('資料格式錯誤，請輸入正確的JSON格式');
        return;
      }
    }
    
    onAddNode('http-request', nodeData);
    setHttpConfig({ url: '', method: 'GET', name: '', useDataFrom: 'none', customData: '' });
  };

  const addConditionNode = () => {
    const conditions = {
      success: { condition: '$prev.success === true', label: '檢查：執行成功' },
      failed: { condition: '$prev.success === false', label: '檢查：執行失敗' },
      error400: { condition: '$prev.error && $prev.error.includes("400")', label: '檢查：400錯誤' },
      error500: { condition: '$prev.error && $prev.error.includes("500")', label: '檢查：500錯誤' }
    };
    
    const selected = conditions[conditionType];
    onAddNode('condition', {
      label: selected.label,
      condition: selected.condition
    });
  };

  const addNotificationNode = () => {
    onAddNode('notification', {
      label: `通知：${notificationConfig.message}`,
      message: notificationConfig.message
    });
    setNotificationConfig({ message: '' });
  };

  const addLineNode = () => {
    const name = lineConfig.name || `LINE${lineConfig.type === 'push' ? '推送' : '回覆'}`;
    
    const nodeData = {
      label: name,
      name,
      method: 'POST',
      useDataFrom: 'custom'
    };
    
    if (lineConfig.type === 'push') {
      nodeData.url = 'https://api.line.me/v2/bot/message/push';
      nodeData.body = {
        to: lineConfig.userId,
        messages: [{
          type: 'text',
          text: lineConfig.message
        }]
      };
    } else {
      nodeData.url = 'https://api.line.me/v2/bot/message/reply';
      nodeData.body = {
        replyToken: lineConfig.replyToken,
        messages: [{
          type: 'text',
          text: lineConfig.message
        }]
      };
    }
    
    nodeData.headers = {
      'Authorization': `Bearer ${lineConfig.accessToken}`,
      'Content-Type': 'application/json'
    };
    
    onAddNode('http-request', nodeData);
    
    setLineConfig({ 
      type: 'push', 
      name: '', 
      accessToken: '', 
      userId: '', 
      message: '',
      replyToken: ''
    });
  };

  const addWebhookNode = () => {
    const name = webhookConfig.name || 'Webhook觸發';
    onAddNode('webhook-trigger', {
      label: name,
      name,
      description: webhookConfig.description
    });
    setWebhookConfig({ name: '', description: '' });
  };

  return (
    <div className="node-panel">
      <h3>📦 動作庫</h3>
      
      <div className="node-config">
        <h4>🌐 呼叫API</h4>
        <input 
          placeholder="動作名稱 (例：取得用戶資料)"
          value={httpConfig.name}
          onChange={(e) => setHttpConfig({...httpConfig, name: e.target.value})}
        />
        <select 
          value={httpConfig.method} 
          onChange={(e) => setHttpConfig({...httpConfig, method: e.target.value})}
        >
          <option value="GET">取得資料 (GET)</option>
          <option value="POST">新增資料 (POST)</option>
          <option value="PUT">更新資料 (PUT)</option>
          <option value="DELETE">刪除資料 (DELETE)</option>
        </select>
        <input 
          placeholder="API網址 (可用{id}來使用前一步的資料)"
          value={httpConfig.url}
          onChange={(e) => setHttpConfig({...httpConfig, url: e.target.value})}
        />
        
        <div style={{margin: '10px 0'}}>
          <label>📦 要發送的資料：</label>
          <select 
            value={httpConfig.useDataFrom}
            onChange={(e) => setHttpConfig({...httpConfig, useDataFrom: e.target.value})}
          >
            <option value="none">不發送資料</option>
            <option value="previous">使用前一步的結果</option>
            <option value="custom">自定義資料</option>
          </select>
        </div>
        
        {httpConfig.useDataFrom === 'custom' && (
          <textarea 
            placeholder='{"name": "test", "age": 25}'
            value={httpConfig.customData}
            onChange={(e) => setHttpConfig({...httpConfig, customData: e.target.value})}
            rows={3}
          />
        )}
        
        <button onClick={addHttpNode} disabled={!httpConfig.url}>➕ 新增API呼叫</button>
      </div>

      <div className="node-config">
        <h4>❓ 條件檢查</h4>
        <select 
          value={conditionType}
          onChange={(e) => setConditionType(e.target.value)}
        >
          <option value="success">✅ 前一步執行成功</option>
          <option value="failed">❌ 前一步執行失敗</option>
          <option value="error400">⚠️ 發生400錯誤</option>
          <option value="error500">🚨 發生500錯誤</option>
        </select>
        <button onClick={addConditionNode}>➕ 新增條件檢查</button>
      </div>

      <DataMapPanel onAddNode={onAddNode} />
      
      <div className="node-config">
        <h4>📱 LINE訊息</h4>
        <input 
          placeholder="動作名稱"
          value={lineConfig.name}
          onChange={(e) => setLineConfig({...lineConfig, name: e.target.value})}
        />
        <select 
          value={lineConfig.type}
          onChange={(e) => setLineConfig({...lineConfig, type: e.target.value})}
        >
          <option value="push">📤 主動推送訊息</option>
          <option value="reply">💬 回覆訊息</option>
        </select>
        <input 
          placeholder="Channel Access Token"
          value={lineConfig.accessToken}
          onChange={(e) => setLineConfig({...lineConfig, accessToken: e.target.value})}
          type="password"
        />
        {lineConfig.type === 'push' ? (
          <input 
            placeholder="用戶ID (可用{userId}引用前一步資料)"
            value={lineConfig.userId}
            onChange={(e) => setLineConfig({...lineConfig, userId: e.target.value})}
          />
        ) : (
          <input 
            placeholder="Reply Token (可用{replyToken}引用)"
            value={lineConfig.replyToken}
            onChange={(e) => setLineConfig({...lineConfig, replyToken: e.target.value})}
          />
        )}
        <textarea 
          placeholder="訊息內容 (可用{name}等變數)"
          value={lineConfig.message}
          onChange={(e) => setLineConfig({...lineConfig, message: e.target.value})}
          rows={3}
        />
        <button 
          onClick={addLineNode} 
          disabled={!lineConfig.accessToken || !lineConfig.message || 
                   (lineConfig.type === 'push' && !lineConfig.userId) ||
                   (lineConfig.type === 'reply' && !lineConfig.replyToken)}
        >
          ➕ 新增LINE{lineConfig.type === 'push' ? '推送' : '回覆'}
        </button>
        <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '5px'}}>
          💡 提示：這會建立一個HTTP POST節點來呼叫LINE API
        </small>
      </div>
      
      <div className="node-config">
        <h4>🔗 Webhook觸發</h4>
        <input 
          placeholder="觸發名稱 (例：LINE訊息接收)"
          value={webhookConfig.name}
          onChange={(e) => setWebhookConfig({...webhookConfig, name: e.target.value})}
        />
        <textarea 
          placeholder="描述這個webhook的用途"
          value={webhookConfig.description}
          onChange={(e) => setWebhookConfig({...webhookConfig, description: e.target.value})}
          rows={2}
        />
        <button onClick={addWebhookNode} disabled={!webhookConfig.name}>➕ 新增Webhook觸發</button>
        <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '5px'}}>
          💡 提示：儲存流程後會顯示Webhook網址
        </small>
      </div>
      
      <div className="node-config">
        <h4>📢 顯示訊息</h4>
        <input 
          placeholder="要顯示的訊息"
          value={notificationConfig.message}
          onChange={(e) => setNotificationConfig({message: e.target.value})}
        />
        <button onClick={addNotificationNode} disabled={!notificationConfig.message}>➕ 新增訊息顯示</button>
      </div>
    </div>
  );
}

export default NodePanel;