import React from 'react';

function NodePanel({ onAddNode, compact = false }) {

  const nodeGroups = {
    '基礎': [
      { type: 'http-request', icon: '🌐', label: 'API呼叫', description: '呼叫HTTP API' },
      { type: 'condition', icon: '❓', label: '條件判斷', description: '根據條件分支' },
      { type: 'data-map', icon: '🔄', label: '資料映射', description: '轉換資料格式' },
      { type: 'notification', icon: '📢', label: '顯示訊息', description: '顯示通知訊息' }
    ],
    'LINE': [
      { type: 'line-push', icon: '📱', label: 'LINE推送', description: '發送LINE訊息' },
      { type: 'line-reply', icon: '💬', label: 'LINE回覆', description: '回覆LINE訊息' },
      { type: 'line-carousel', icon: '🎠', label: 'LINE多頁', description: '多頁訊息卡片' }
    ],
    '觸發器': [
      { type: 'webhook-trigger', icon: '🔗', label: 'Webhook觸發', description: '接收外部觸發' }
    ]
  };

  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType.type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const addNodeDirectly = (nodeType) => {
    const defaultData = {
      'http-request': { label: 'API呼叫', url: '', method: 'GET' },
      'condition': { label: '條件判斷', field: '{message}', operator: 'contains', value: '你好' },
      'data-map': { label: '資料映射', name: '', mappings: [{from: '', to: ''}] },
      'line-push': { 
        label: 'LINE推送', 
        name: '',
        url: 'https://api.line.me/v2/bot/message/push', 
        method: 'POST',
        useDataFrom: 'custom',
        headers: { 'Authorization': 'Bearer ', 'Content-Type': 'application/json' },
        body: { to: '', messages: [{ type: 'text', text: '' }] }
      },
      'line-reply': { 
        label: 'LINE回覆', 
        name: '',
        url: 'https://api.line.me/v2/bot/message/reply', 
        method: 'POST',
        useDataFrom: 'custom',
        headers: { 'Authorization': 'Bearer ', 'Content-Type': 'application/json' },
        body: { replyToken: '', messages: [{ type: 'text', text: '' }] }
      },
      'line-carousel': {
        label: 'LINE多頁',
        name: '',
        headers: { 'Authorization': 'Bearer ', 'Content-Type': 'application/json' },
        body: {
          replyToken: '{replyToken}',
          messages: [{
            type: 'template',
            altText: '多頁訊息',
            template: {
              type: 'carousel',
              columns: [
                {
                  title: '標题1',
                  text: '內容1',
                  actions: [{ type: 'message', label: '選擇1', text: '選擇1' }]
                }
              ]
            }
          }]
        }
      },
      'webhook-trigger': { label: 'Webhook觸發', name: '', description: '' },
      'notification': { label: '顯示訊息', message: '' }
    };
    
    onAddNode(nodeType, defaultData[nodeType] || { label: nodeType });
  };

  return (
    <div className="node-panel">
      {!compact && <h3>📦 節點庫</h3>}
      {!compact && (
        <p style={{fontSize: '12px', color: '#666', margin: '0 0 15px 0'}}>
          拖拉節點到畫面上，或點擊直接新增
        </p>
      )}
      
      <div className={`node-library ${compact ? 'compact' : ''}`}>
        {Object.entries(nodeGroups).map(([groupName, nodes]) => (
          <div key={groupName} className="node-group">
            {!compact && <div className="group-title">{groupName}</div>}
            {nodes.map((nodeType) => (
              <div
                key={nodeType.type}
                className={`draggable-node ${compact ? 'compact' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, nodeType)}
                onClick={() => addNodeDirectly(nodeType.type)}
                title={compact ? nodeType.label : ''}
              >
                <div className="node-icon">{nodeType.icon}</div>
                {!compact && (
                  <div className="node-info">
                    <div className="node-title">{nodeType.label}</div>
                    <div className="node-desc">{nodeType.description}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NodePanel;