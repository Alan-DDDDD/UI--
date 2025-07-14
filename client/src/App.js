import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  addEdge, 
  useNodesState, 
  useEdgesState,
  Controls,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';
import NodePanel from './NodePanel';
import ExecutePanel from './ExecutePanel';
import NodeEditor from './NodeEditor';
import WorkflowList from './WorkflowList';
import TokenManager from './TokenManager';
import './App.css';

// 自定義邊樣式
const defaultEdgeOptions = {
  style: {
    stroke: '#4CAF50',
    strokeWidth: 3,
  },
  type: 'smoothstep',
  animated: true,
};

// 暫停的邊樣式
const pausedEdgeStyle = {
  stroke: '#FFD700',
  strokeWidth: 3,
  strokeDasharray: '5,5',
};

const initialNodes = [];
const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowId, setWorkflowId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentWorkflowName, setCurrentWorkflowName] = useState('新流程');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({...params, ...defaultEdgeOptions, data: { active: true }}, eds));
    setHasUnsavedChanges(true);
  }, [setEdges]);

  // 邊的右鍵選單處理
  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    const menu = document.createElement('div');
    menu.className = 'edge-context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: #2d2d2d;
      border: 1px solid #404040;
      border-radius: 4px;
      padding: 8px 0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = edge.data?.active !== false ? '⏸️ 暫停路徑' : '▶️ 啟用路徑';
    toggleBtn.style.cssText = `
      width: 100%;
      padding: 8px 16px;
      background: none;
      border: none;
      color: #e0e0e0;
      cursor: pointer;
      text-align: left;
    `;
    toggleBtn.onmouseover = () => toggleBtn.style.background = '#404040';
    toggleBtn.onmouseout = () => toggleBtn.style.background = 'none';
    toggleBtn.onclick = () => {
      const isCurrentlyActive = edge.data?.active !== false;
      setEdges((eds) => eds.map((e) => 
        e.id === edge.id 
          ? { 
              ...e, 
              data: { ...e.data, active: !isCurrentlyActive },
              style: isCurrentlyActive ? { stroke: '#FFD700', strokeWidth: 3, strokeDasharray: '5,5' } : { stroke: '#4CAF50', strokeWidth: 3 },
              animated: !isCurrentlyActive
            }
          : e
      ));
      setHasUnsavedChanges(true);
      document.body.removeChild(menu);
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ 刪除路徑';
    deleteBtn.style.cssText = `
      width: 100%;
      padding: 8px 16px;
      background: none;
      border: none;
      color: #e0e0e0;
      cursor: pointer;
      text-align: left;
    `;
    deleteBtn.onmouseover = () => deleteBtn.style.background = '#dc3545';
    deleteBtn.onmouseout = () => deleteBtn.style.background = 'none';
    deleteBtn.onclick = () => {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      setHasUnsavedChanges(true);
      document.body.removeChild(menu);
    };
    
    menu.appendChild(toggleBtn);
    menu.appendChild(deleteBtn);
    document.body.appendChild(menu);
    
    const closeMenu = () => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
      document.removeEventListener('click', closeMenu);
    };
    
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
  }, [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = event.target.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
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
          templateType: 'carousel',
          messageType: 'reply',
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
                    title: '商品1',
                    text: '商品描述',
                    actions: [{ type: 'message', label: '購買', text: '購買商品1' }]
                  }
                ]
              }
            }]
          }
        },
        'webhook-trigger': { label: 'Webhook觸發', name: '', description: '' },
        'notification': { label: '顯示訊息', message: '' }
      };

      const newNode = {
        id: `${type}-${Date.now()}`,
        type: 'default',
        position,
        data: {
          type,
          ...defaultData[type],
          label: getNodeDisplayLabel(type, defaultData[type])
        },
        className: `node-${type}`,
      };

      setNodes((nds) => nds.concat(newNode));
      setHasUnsavedChanges(true);
    },
    [setNodes]
  );

  const addNode = (type, data) => {
    // 計算新節點位置，水平排列且在畫面可見區域
    const baseX = 50;
    const baseY = 150;
    const spacing = 250;
    const position = {
      x: baseX + (nodes.length % 4) * spacing, // 每4個節點換行
      y: baseY + Math.floor(nodes.length / 4) * 150 // 每行間隔150px
    };
    
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position,
      data: { 
        label: getNodeDisplayLabel(type, data),
        type,
        ...data
      },
      className: `node-${type}`,
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const updateNode = (nodeId, newData) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                ...newData,
                label: getNodeDisplayLabel(node.data.type, newData)
              }
            }
          : node
      )
    );
    setHasUnsavedChanges(true);
  };

  const getNodeDisplayLabel = (type, data) => {
    switch (type) {
      case 'condition':
        if (data.field && data.operator && data.value !== undefined) {
          return `條件: ${data.field} ${data.operator} ${data.value}`;
        }
        return '條件判斷';
      
      case 'line-reply':
        const replyText = data.body?.messages?.[0]?.text || '';
        return `LINE回覆: ${replyText.substring(0, 15)}${replyText.length > 15 ? '...' : ''}`;
      
      case 'line-push':
        const pushText = data.body?.messages?.[0]?.text || '';
        const pushTo = data.body?.to || '';
        return `LINE推送: ${pushText.substring(0, 15)}${pushText.length > 15 ? '...' : ''}`;
      
      default:
        return data.name || data.label || type;
    }
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setHasUnsavedChanges(true);
  };

  const handleSelectWorkflow = async (selectedWorkflowId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/workflows/${selectedWorkflowId}`);
      const workflow = await response.json();
      
      // 為現有節點添加className
      const nodesWithType = (workflow.nodes || []).map(node => ({
        ...node,
        className: `node-${node.data?.type || 'default'}`
      }));
      
      setNodes(nodesWithType);
      setEdges(workflow.edges || []);
      setWorkflowId(selectedWorkflowId);
      setCurrentWorkflowName(workflow.name || '流程');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('載入流程失敗:', error);
    }
  };

  const handleNewWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowId(null);
    setCurrentWorkflowName('新流程');
    setHasUnsavedChanges(false);
  };

  return (
    <div className="app">
      <div className="sidebar">
        <WorkflowList 
          onSelectWorkflow={handleSelectWorkflow}
          onNewWorkflow={handleNewWorkflow}
          currentWorkflowId={workflowId}
        />
        <TokenManager />
        <NodePanel onAddNode={addNode} />
        <ExecutePanel 
          nodes={nodes} 
          edges={edges}
          workflowId={workflowId}
          setWorkflowId={setWorkflowId}
          workflowName={currentWorkflowName}
          hasUnsavedChanges={hasUnsavedChanges}
          setHasUnsavedChanges={setHasUnsavedChanges}
        />
      </div>
      <div className="flow-container">
        {hasUnsavedChanges && (
          <div className="unsaved-warning-overlay">
            ⚠️ 有未儲存的變更，請先儲存流程
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onDrop={onDrop}
          onDragOver={onDragOver}
          defaultEdgeOptions={defaultEdgeOptions}
        >
          <Controls />
          <Background 
            color="#404040"
            gap={20}
            size={1}
            variant="dots"
          />
          <Controls />
        </ReactFlow>
        
        <NodeEditor 
          selectedNode={selectedNode}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
}

export default App;