import React, { useState } from 'react';
import axios from 'axios';

function ExecutePanel({ nodes, edges, workflowId, setWorkflowId, hasUnsavedChanges, setHasUnsavedChanges, nodeGroups }) {
  const [inputData, setInputData] = useState('{}');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const saveWorkflow = async () => {
    try {
      if (workflowId) {
        // 更新現有流程
        await axios.put(`http://localhost:3001/api/workflows/${workflowId}`, {
          nodes,
          edges,
          nodeGroups
        });
        console.log('💾 流程已更新，ID:', workflowId);
        setHasUnsavedChanges(false);
      } else {
        // 創建新流程
        const response = await axios.post('http://localhost:3001/api/workflows', {
          name: '新流程',
          description: '',
          nodes,
          edges,
          nodeGroups
        });
        setWorkflowId(response.data.workflowId);
        console.log('💾 流程已儲存，ID:', response.data.workflowId);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      alert('儲存失敗: ' + errorMessage);
    }
  };

  const executeWorkflow = async () => {
    if (!workflowId) {
      alert('請先儲存工作流程');
      return;
    }

    setLoading(true);
    try {
      // 重新儲存流程以確保最新的節點設定
      await saveWorkflow();
      
      const response = await axios.post(
        `http://localhost:3001/api/execute/${workflowId}`,
        { inputData: JSON.parse(inputData) }
      );
      setResults(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      alert('執行失敗: ' + errorMessage);
    }
    setLoading(false);
  };

  const renderResults = () => {
    if (!results) return null;
    
    return (
      <div className="results">
        <h4>📋 執行結果</h4>
        
        {results.results.map((result, index) => {
          const node = result.result;
          const isSuccess = node.success;
          const isNotification = node.data && node.data.type === 'notification';
          
          return (
            <div key={index} className={`result-item ${isSuccess ? 'success' : 'error'}`}>
              {isNotification ? (
                <div className="notification-result">
                  📢 {node.data.message}
                </div>
              ) : isSuccess ? (
                <div className="success-result">
                  ✅ 步驟 {index + 1} 執行成功
                </div>
              ) : (
                <div className="error-result">
                  ❌ 步驟 {index + 1} 執行失敗：{node.error}
                </div>
              )}
            </div>
          );
        })}
        
        <details style={{marginTop: '15px'}}>
          <summary>🔍 查看詳細資料</summary>
          <pre style={{fontSize: '12px', marginTop: '10px'}}>{JSON.stringify(results, null, 2)}</pre>
        </details>
      </div>
    );
  };

  return (
    <div className="execute-panel">
      <h3>🚀 執行控制</h3>
      
      <button onClick={saveWorkflow} className={hasUnsavedChanges ? 'save-btn-highlight' : ''}>💾 儲存流程</button>
      {workflowId && (
        <div className="workflow-saved">
          ✅ 流程已儲存
          <div style={{marginTop: '10px', fontSize: '12px'}}>
            <strong>🔗 Webhook網址：</strong>
            <div style={{background: '#f8f9fa', padding: '8px', borderRadius: '4px', marginTop: '5px'}}>
              <div>一般: <code>http://localhost:3001/webhook/{workflowId}</code></div>
              <div>LINE: <code>http://localhost:3001/webhook/line/{workflowId}</code></div>
            </div>
          </div>
        </div>
      )}
      <div style={{fontSize: '12px', color: '#666', margin: '10px 0'}}>
        💡 提示：修改節點後請重新儲存流程
      </div>
      
      <div>
        <h4>📝 輸入資料</h4>
        <textarea 
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder='{"username": "test", "password": "123"}'
        />
      </div>
      
      <button onClick={executeWorkflow} disabled={loading} className="execute-btn">
        {loading ? '🔄 執行中...' : '▶️ 開始執行'}
      </button>
      <small style={{fontSize: '11px', color: '#666'}}>
        執行時會自動重新儲存流程
      </small>
      
      {renderResults()}
    </div>
  );
}

export default ExecutePanel;