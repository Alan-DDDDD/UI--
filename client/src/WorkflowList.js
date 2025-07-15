import React, { useState, useEffect } from 'react';
import axios from 'axios';

function WorkflowList({ onSelectWorkflow, onNewWorkflow, currentWorkflowId }) {
  const [workflows, setWorkflows] = useState([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [showCombineDialog, setShowCombineDialog] = useState(false);
  const [selectedWorkflows, setSelectedWorkflows] = useState([]);
  const [combinedWorkflowName, setCombinedWorkflowName] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/workflows');
      setWorkflows(response.data.workflows);
    } catch (error) {
      console.error('載入流程列表失敗:', error);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) return;
    
    try {
      const response = await axios.post('http://localhost:3001/api/workflows', {
        name: newWorkflowName,
        description: newWorkflowDesc,
        nodes: [],
        edges: []
      });
      
      setShowNewDialog(false);
      setNewWorkflowName('');
      setNewWorkflowDesc('');
      loadWorkflows();
      
      // 自動選擇新創建的流程
      if (response.data.workflowId) {
        onSelectWorkflow(response.data.workflowId);
      } else {
        onNewWorkflow();
      }
    } catch (error) {
      console.error('創建流程失敗:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (!window.confirm('確定要刪除這個流程嗎？')) return;
    
    try {
      await axios.delete(`http://localhost:3001/api/workflows/${workflowId}`);
      loadWorkflows();
    } catch (error) {
      console.error('刪除流程失敗:', error);
    }
  };

  const handleCombineWorkflows = async () => {
    if (selectedWorkflows.length < 2 || !combinedWorkflowName.trim()) return;
    
    try {
      const response = await axios.post('http://localhost:3001/api/workflows/combine', {
        name: combinedWorkflowName,
        workflowIds: selectedWorkflows
      });
      
      setShowCombineDialog(false);
      setSelectedWorkflows([]);
      setCombinedWorkflowName('');
      loadWorkflows();
      
      // 自動選擇新組合的流程
      if (response.data.workflowId) {
        onSelectWorkflow(response.data.workflowId);
      }
    } catch (error) {
      console.error('組合流程失敗:', error);
      const errorMessage = error.response?.data?.error || error.message;
      alert('組合流程失敗: ' + errorMessage);
    }
  };

  return (
    <div className="workflow-list">
      <div className="workflow-list-header">
        <h3>📋 流程列表</h3>
        <div style={{display: 'flex', gap: '8px'}}>
          <button 
            onClick={() => setShowNewDialog(true)}
            className="new-workflow-btn"
          >
            ➕ 新增流程
          </button>
          <button 
            onClick={() => setShowCombineDialog(true)}
            className="new-workflow-btn"
            style={{background: '#FF9800'}}
          >
            🔗 組合流程
          </button>
        </div>
      </div>

      <div className="workflow-items">
        {workflows.map(workflow => (
          <div 
            key={workflow.id}
            className={`workflow-item ${workflow.id === currentWorkflowId ? 'active' : ''}`}
            onClick={() => onSelectWorkflow(workflow.id)}
          >
            <div className="workflow-info">
              <div className="workflow-name">{workflow.name}</div>
              <div className="workflow-desc">{workflow.description}</div>
              <div className="workflow-meta">
                {workflow.nodeCount} 個節點 • {new Date(workflow.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteWorkflow(workflow.id);
              }}
              className="delete-workflow-btn"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {showNewDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h4>新增流程</h4>
            <input 
              placeholder="流程名稱"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
            />
            <textarea 
              placeholder="流程描述"
              value={newWorkflowDesc}
              onChange={(e) => setNewWorkflowDesc(e.target.value)}
              rows={3}
            />
            <div className="dialog-buttons">
              <button onClick={handleCreateWorkflow}>創建</button>
              <button onClick={() => setShowNewDialog(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {showCombineDialog && (
        <div className="dialog-overlay">
          <div className="dialog" style={{width: '500px'}}>
            <h4>🔗 組合流程</h4>
            <input 
              placeholder="新流程名稱"
              value={combinedWorkflowName}
              onChange={(e) => setCombinedWorkflowName(e.target.value)}
            />
            <div style={{margin: '15px 0'}}>
              <label style={{display: 'block', marginBottom: '8px'}}>選擇要組合的流程：</label>
              <div style={{maxHeight: '200px', overflowY: 'auto', border: '1px solid #555', borderRadius: '4px', padding: '8px'}}>
                {workflows.map(workflow => (
                  <label key={workflow.id} style={{display: 'block', margin: '5px 0', cursor: 'pointer'}}>
                    <input 
                      type="checkbox"
                      checked={selectedWorkflows.includes(workflow.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWorkflows([...selectedWorkflows, workflow.id]);
                        } else {
                          setSelectedWorkflows(selectedWorkflows.filter(id => id !== workflow.id));
                        }
                      }}
                      style={{marginRight: '8px'}}
                    />
                    {workflow.name} ({workflow.nodeCount} 個節點)
                  </label>
                ))}
              </div>
            </div>
            <div className="dialog-buttons">
              <button 
                onClick={handleCombineWorkflows}
                disabled={selectedWorkflows.length < 2 || !combinedWorkflowName.trim()}
              >
                組合
              </button>
              <button onClick={() => {
                setShowCombineDialog(false);
                setSelectedWorkflows([]);
                setCombinedWorkflowName('');
              }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowList;