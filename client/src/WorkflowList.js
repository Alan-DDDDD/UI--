import React, { useState, useEffect } from 'react';
import axios from 'axios';

function WorkflowList({ onSelectWorkflow, onNewWorkflow, currentWorkflowId }) {
  const [workflows, setWorkflows] = useState([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');

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

  return (
    <div className="workflow-list">
      <div className="workflow-list-header">
        <h3>📋 流程列表</h3>
        <button 
          onClick={() => setShowNewDialog(true)}
          className="new-workflow-btn"
        >
          ➕ 新增流程
        </button>
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
    </div>
  );
}

export default WorkflowList;