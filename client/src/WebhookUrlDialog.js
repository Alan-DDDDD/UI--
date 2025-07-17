import React, { useState } from 'react';
import './WebhookUrlDialog.css';

function WebhookUrlDialog({ isOpen, onClose, workflowId }) {
  const [copied, setCopied] = useState('');

  if (!isOpen || !workflowId) return null;

  const baseUrl = 'http://localhost:3001';
  const generalUrl = `${baseUrl}/webhook/${workflowId}`;
  const lineUrl = `${baseUrl}/webhook/line/${workflowId}`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="webhook-dialog-overlay">
      <div className="webhook-dialog">
        <div className="webhook-header">
          <h3>🔗 Webhook 網址</h3>
          <button onClick={onClose} className="webhook-close-btn">✕</button>
        </div>
        
        <div className="webhook-content">
          <div className="webhook-section">
            <div className="webhook-label">
              <span className="webhook-icon">🌐</span>
              <strong>一般 Webhook</strong>
            </div>
            <div className="webhook-url-container">
              <input 
                type="text" 
                value={generalUrl} 
                readOnly 
                className="webhook-url-input"
              />
              <button 
                onClick={() => copyToClipboard(generalUrl, 'general')}
                className="copy-btn"
              >
                {copied === 'general' ? '✅' : '📋'}
              </button>
            </div>
            <div className="webhook-desc">用於接收一般的 HTTP POST 請求</div>
          </div>

          <div className="webhook-section">
            <div className="webhook-label">
              <span className="webhook-icon">📱</span>
              <strong>LINE Bot Webhook</strong>
            </div>
            <div className="webhook-url-container">
              <input 
                type="text" 
                value={lineUrl} 
                readOnly 
                className="webhook-url-input"
              />
              <button 
                onClick={() => copyToClipboard(lineUrl, 'line')}
                className="copy-btn"
              >
                {copied === 'line' ? '✅' : '📋'}
              </button>
            </div>
            <div className="webhook-desc">用於 LINE Bot 的 Webhook 設定</div>
          </div>

          <div className="webhook-tips">
            <h4>💡 使用說明</h4>
            <ul>
              <li>將網址複製到外部系統的 Webhook 設定中</li>
              <li>LINE Bot 請使用 LINE 專用網址</li>
              <li>確保流程已儲存後再使用 Webhook</li>
              <li>可在流程中使用 Webhook 觸發節點作為起始點</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebhookUrlDialog;