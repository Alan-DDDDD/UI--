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
import './App.css';

const initialNodes = [];
const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowId, setWorkflowId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = (type, data) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: data.label,
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
                label: newData.name || newData.label || node.data.label
              }
            }
          : node
      )
    );
  };

  return (
    <div className="app">
      <div className="sidebar">
        <NodePanel onAddNode={addNode} />
        <ExecutePanel 
          nodes={nodes} 
          edges={edges}
          workflowId={workflowId}
          setWorkflowId={setWorkflowId}
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
        >
          <Controls />
          <Background />
        </ReactFlow>
        
        <NodeEditor 
          selectedNode={selectedNode}
          onUpdateNode={updateNode}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
}

export default App;