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

const initialNodes = [];
const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowId, setWorkflowId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [currentWorkflowName, setCurrentWorkflowName] = useState('新流程');

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const addNode = (type, data) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: getNodeDisplayLabel(type, data),
        type,
        ...data
      }
    };
    setNodes((nds) => [...nds, newNode]);
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
  };

  const handleSelectWorkflow = async (selectedWorkflowId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/workflows/${selectedWorkflowId}`);
      const workflow = await response.json();
      
      setNodes(workflow.nodes || []);
      setEdges(workflow.edges || []);
      setWorkflowId(selectedWorkflowId);
      setCurrentWorkflowName(workflow.name || '流程');
    } catch (error) {
      console.error('載入流程失敗:', error);
    }
  };

  const handleNewWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowId(null);
    setCurrentWorkflowName('新流程');
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
        />
      </div>
      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <Controls />
          <Background />
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