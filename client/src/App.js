import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  useNodesState, 
  useEdgesState,
  Controls,
  Background,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import NodePanel from './NodePanel';
import ExecutePanel from './ExecutePanel';
import NodeEditor from './NodeEditor';
import WindowManager from './WindowManager';
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

function FlowWrapper() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowId, setWorkflowId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentWorkflowName, setCurrentWorkflowName] = useState('新流程');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sidebarMode, setSidebarMode] = useState('full'); // 'full', 'compact', 'hidden'
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [nodeGroups, setNodeGroups] = useState({}); // groupId -> [nodeIds]
  const { project } = useReactFlow();

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    setHasUnsavedChanges(true);
  }, [onNodesChange]);

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

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // 如果沒有指定位置，使用水平佈局
      if (!position.x || !position.y) {
        const baseX = 50;
        const baseY = 150;
        const spacingX = 200;
        const spacingY = 120;
        const nodesPerRow = 6;
        position.x = baseX + (nodes.length % nodesPerRow) * spacingX;
        position.y = baseY + Math.floor(nodes.length / nodesPerRow) * spacingY;
      }
      
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
        'notification': { label: '顯示訊息', message: '' },
        'existing-workflow': { label: '現有流程', workflowId: '', workflowName: '請選擇流程' }
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
        sourcePosition: 'right',
        targetPosition: 'left'
      };

      setNodes((nds) => nds.concat(newNode));
      setHasUnsavedChanges(true);
    },
    [setNodes]
  );

  const addNode = (type, data) => {
    // 計算新節點位置，水平排列
    const baseX = 50;
    const baseY = 150;
    const spacingX = 200; // 水平間距
    const spacingY = 120; // 垂直間距
    const nodesPerRow = 6; // 每行最多6個節點
    const position = {
      x: baseX + (nodes.length % nodesPerRow) * spacingX,
      y: baseY + Math.floor(nodes.length / nodesPerRow) * spacingY
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
      sourcePosition: 'right',
      targetPosition: 'left'
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  };

  const onNodeClick = useCallback((event, node) => {
    if (event.ctrlKey || event.metaKey) {
      setSelectedNodes(prev => 
        prev.includes(node.id) 
          ? prev.filter(id => id !== node.id)
          : [...prev, node.id]
      );
    } else {
      setSelectedNode(node);
      setSelectedNodes([]);
    }
  }, []);

  const createGroup = () => {
    if (selectedNodes.length < 2) {
      alert('請選擇至少2個節點進行分組');
      return;
    }
    setShowGroupDialog(true);
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;
    
    const selectedNodeObjects = nodes.filter(node => selectedNodes.includes(node.id));
    const minX = Math.min(...selectedNodeObjects.map(n => n.position.x));
    const minY = Math.min(...selectedNodeObjects.map(n => n.position.y));
    const maxX = Math.max(...selectedNodeObjects.map(n => {
      const width = n.style?.width || (n.type === 'group' ? 200 : 150);
      return n.position.x + width;
    }));
    const maxY = Math.max(...selectedNodeObjects.map(n => {
      const height = n.style?.height || (n.type === 'group' ? 100 : 50);
      return n.position.y + height;
    }));
    
    const groupId = `group-${Date.now()}`;
    const groupNode = {
      id: groupId,
      type: 'group',
      position: { x: minX - 20, y: minY - 40 },
      data: { label: groupName },
      style: {
        width: maxX - minX + 40,
        height: maxY - minY + 60,
        backgroundColor: 'rgba(64, 64, 64, 0.1)',
        border: '2px solid #666',
        borderRadius: '8px'
      },
      draggable: true,
      selectable: true,
      className: 'node-group',
      'data-level': nodes.filter(n => n.type === 'group').length
    };
    
    // 先添加群組節點，再設定子節點的parentNode
    setNodes(nds => [...nds, groupNode]);
    
    setTimeout(() => {
      setNodes(nds => nds.map(n => {
        if (selectedNodes.includes(n.id)) {
          return {
            ...n,
            parentNode: groupId,
            position: {
              x: n.position.x - (minX - 20),
              y: n.position.y - (minY - 40)
            }
          };
        }
        return n;
      }));
    }, 0);
    setNodeGroups(prev => ({ ...prev, [groupId]: selectedNodes }));
    setSelectedNodes([]);
    setShowGroupDialog(false);
    setGroupName('');
    setHasUnsavedChanges(true);
  };

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
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    
    if (nodeToDelete && nodeToDelete.type === 'group') {
      // 刪除群組時，先移除子節點的parentNode關係
      setNodes((nds) => nds.map(n => 
        n.parentNode === nodeId 
          ? { ...n, parentNode: undefined }
          : n
      ).filter((node) => node.id !== nodeId));
      // 清理nodeGroups
      setNodeGroups(prev => {
        const newGroups = { ...prev };
        delete newGroups[nodeId];
        return newGroups;
      });
    } else {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    }
    
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setHasUnsavedChanges(true);
  };

  const handleSelectWorkflow = async (selectedWorkflowId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/workflows/${selectedWorkflowId}`);
      const workflow = await response.json();
      
      // 為現有節點添加className和連接點位置
      const nodesWithType = (workflow.nodes || []).map(node => ({
        ...node,
        className: node.type === 'group' ? 'node-group' : `node-${node.data?.type || 'default'}`,
        sourcePosition: node.type === 'group' ? undefined : 'right',
        targetPosition: node.type === 'group' ? undefined : 'left'
      }));
      
      setNodes(nodesWithType);
      setEdges(workflow.edges || []);
      setNodeGroups(workflow.nodeGroups || {});
      setWorkflowId(selectedWorkflowId);
      setCurrentWorkflowName(workflow.name || '流程');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('載入流程失敗:', error);
      alert('載入流程失敗: ' + error.message);
    }
  };

  const handleNewWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setNodeGroups({});
    setWorkflowId(null);
    setCurrentWorkflowName('新流程');
    setHasUnsavedChanges(false);
  };

  return (
    <div className="app">
      {/* 側邊欄切換按鈕 */}
      <div className="sidebar-toggle">
        <button 
          onClick={() => setSidebarMode(sidebarMode === 'full' ? 'compact' : sidebarMode === 'compact' ? 'hidden' : 'full')}
          className="toggle-btn"
        >
          {sidebarMode === 'full' ? '◀' : sidebarMode === 'compact' ? '✕' : '▶'}
        </button>
      </div>
      
      {sidebarMode !== 'hidden' && (
        <div className={`sidebar ${sidebarMode}`}>
          <WindowManager 
            onSelectWorkflow={handleSelectWorkflow}
            onNewWorkflow={handleNewWorkflow}
            currentWorkflowId={workflowId}
            compact={sidebarMode === 'compact'}
          />
          <NodePanel onAddNode={addNode} compact={sidebarMode === 'compact'} />
          {sidebarMode === 'full' && (
            <ExecutePanel 
              nodes={nodes} 
              edges={edges}
              workflowId={workflowId}
              setWorkflowId={setWorkflowId}
              workflowName={currentWorkflowName}
              hasUnsavedChanges={hasUnsavedChanges}
              setHasUnsavedChanges={setHasUnsavedChanges}
              nodeGroups={nodeGroups}
            />
          )}
        </div>
      )}
      <div className="flow-container">
        {hasUnsavedChanges && (
          <div className="unsaved-warning-overlay">
            ⚠️ 有未儲存的變更，請先儲存流程
          </div>
        )}
        {/* 群組功能暫時取消
        {selectedNodes.length > 1 && (
          <div className="group-controls">
            <button onClick={createGroup} className="group-btn">
              📦 建立群組 ({selectedNodes.length})
            </button>
          </div>
        )}
        */}
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onDrop={onDrop}
          onDragOver={onDragOver}
          defaultEdgeOptions={defaultEdgeOptions}
          multiSelectionKeyCode="Control"
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
        
        {showGroupDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h4>建立節點群組</h4>
              <input 
                placeholder="群組名稱"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
              />
              <div className="dialog-buttons">
                <button onClick={handleCreateGroup}>建立</button>
                <button onClick={() => setShowGroupDialog(false)}>取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <FlowWrapper />
    </ReactFlowProvider>
  );
}

export default App;