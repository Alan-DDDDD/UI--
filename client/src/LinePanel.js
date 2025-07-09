import React, { useState } from 'react';

function LinePanel({ onAddNode }) {
  const [pushConfig, setPushConfig] = useState({
    name: '',
    accessToken: '',
    userId: '',
    message: ''
  });

  const [replyConfig, setReplyConfig] = useState({
    name: '',
    accessToken: '',
    replyToken: '',
    message: ''
  });

  const addLinePushNode = () => {
    const name = pushConfig.name || 'LINE推送訊息';
    onAddNode('line-push', {
      label: name,
      name,
      accessToken: pushConfig.accessToken,
      userId: pushConfig.userId,
      message: pushConfig.message
    });
    setPushConfig({ name: '', accessToken: '', userId: '', message: '' });
  };

  const addLineReplyNode = () => {
    const name = replyConfig.name || 'LINE回覆訊息';
    onAddNode('line-reply', {
      label: name,
      name,
      accessToken: replyConfig.accessToken,
      replyTokenValue: replyConfig.replyToken,
      message: replyConfig.message
    });
    setReplyConfig({ name: '', accessToken: '', replyToken: '', message: '' });
  };

  return (
    <>
      <div className="node-config">
        <h4>📱 LINE推送訊息</h4>
        <input 
          placeholder="動作名稱 (例：通知客戶)"
          value={pushConfig.name}
          onChange={(e) => setPushConfig({...pushConfig, name: e.target.value})}
        />
        <input 
          placeholder="Channel Access Token"
          value={pushConfig.accessToken}
          onChange={(e) => setPushConfig({...pushConfig, accessToken: e.target.value})}
          type="password"
        />
        <input 
          placeholder="用戶ID (可用{userId}引用前一步資料)"
          value={pushConfig.userId}
          onChange={(e) => setPushConfig({...pushConfig, userId: e.target.value})}
        />
        <textarea 
          placeholder="訊息內容 (可用{name}等變數)"
          value={pushConfig.message}
          onChange={(e) => setPushConfig({...pushConfig, message: e.target.value})}
          rows={3}
        />
        <button 
          onClick={addLinePushNode} 
          disabled={!pushConfig.accessToken || !pushConfig.userId || !pushConfig.message}
        >
          ➕ 新增LINE推送
        </button>
      </div>

      <div className="node-config">
        <h4>💬 LINE回覆訊息</h4>
        <input 
          placeholder="動作名稱 (例：自動回覆)"
          value={replyConfig.name}
          onChange={(e) => setReplyConfig({...replyConfig, name: e.target.value})}
        />
        <input 
          placeholder="Channel Access Token"
          value={replyConfig.accessToken}
          onChange={(e) => setReplyConfig({...replyConfig, accessToken: e.target.value})}
          type="password"
        />
        <input 
          placeholder="Reply Token (可用{replyToken}引用)"
          value={replyConfig.replyToken}
          onChange={(e) => setReplyConfig({...replyConfig, replyToken: e.target.value})}
        />
        <textarea 
          placeholder="回覆內容 (可用{name}等變數)"
          value={replyConfig.message}
          onChange={(e) => setReplyConfig({...replyConfig, message: e.target.value})}
          rows={3}
        />
        <button 
          onClick={addLineReplyNode} 
          disabled={!replyConfig.accessToken || !replyConfig.replyToken || !replyConfig.message}
        >
          ➕ 新增LINE回覆
        </button>
      </div>
    </>
  );
}

export default LinePanel;