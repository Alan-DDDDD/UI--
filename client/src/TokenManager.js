import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TokenManager() {
  const [tokens, setTokens] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [newToken, setNewToken] = useState({ key: '', name: '', token: '' });

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/tokens');
      setTokens(response.data.tokens);
    } catch (error) {
      console.error('載入 Token 失敗:', error);
    }
  };

  const handleSaveToken = async () => {
    if (!newToken.key || !newToken.token) return;
    
    try {
      await axios.post('http://localhost:3001/api/tokens', newToken);
      setShowDialog(false);
      setNewToken({ key: '', name: '', token: '' });
      loadTokens();
    } catch (error) {
      console.error('儲存 Token 失敗:', error);
    }
  };

  const handleDeleteToken = async (key) => {
    if (!window.confirm('確定要刪除這個 Token 嗎？')) return;
    
    try {
      await axios.delete(`http://localhost:3001/api/tokens/${key}`);
      loadTokens();
    } catch (error) {
      console.error('刪除 Token 失敗:', error);
    }
  };

  return (
    <div className="token-manager">
      <div className="token-header">
        <h3>🔑 API Token</h3>
        <button 
          onClick={() => setShowDialog(true)}
          className="add-token-btn"
        >
          ➕ 新增
        </button>
      </div>

      <div className="token-list">
        {tokens.map(token => (
          <div key={token.key} className="token-item">
            <div className="token-info">
              <div className="token-key">{token.key}</div>
              <div className="token-name">{token.name}</div>
              <div className="token-value">{token.masked}</div>
            </div>
            <button 
              onClick={() => handleDeleteToken(token.key)}
              className="delete-token-btn"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {showDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h4>新增 API Token</h4>
            <input 
              placeholder="Token 名稱 (如: lineToken)"
              value={newToken.key}
              onChange={(e) => setNewToken({...newToken, key: e.target.value})}
            />
            <input 
              placeholder="顯示名稱 (如: LINE Bot Token)"
              value={newToken.name}
              onChange={(e) => setNewToken({...newToken, name: e.target.value})}
            />
            <input 
              placeholder="Token 值"
              type="password"
              value={newToken.token}
              onChange={(e) => setNewToken({...newToken, token: e.target.value})}
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              💡 使用方式：在 API 設定中輸入 {'{'}tokenName{'}'} 來引用
            </small>
            <div className="dialog-buttons">
              <button onClick={handleSaveToken}>儲存</button>
              <button onClick={() => setShowDialog(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenManager;