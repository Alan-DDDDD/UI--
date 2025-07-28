import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import WorkflowSettings from './WorkflowSettings';
import UserManual from './UserManual';
import SmartHints from './SmartHints';
import QuickActions from './QuickActions';
import Notification from './Notification';
import WebhookUrlDialog from './WebhookUrlDialog';
import ExecutionResults from './ExecutionResults';
import ExecuteDialog from './ExecuteDialog';
import WorkflowStatus from './WorkflowStatus';
import DebugToolbar from './DebugToolbar';
import VariableInspector from './VariableInspector';
import './WorkflowStatus.css';

import './App.css';
import './BranchEdges.css';
import { API_BASE_URL } from './config';

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

// 分支邊樣式
const branchEdgeStyles = {
  true: {
    stroke: '#4CAF50',
    strokeWidth: 3,
  },
  false: {
    stroke: '#f44336',
    strokeWidth: 3,
  }
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
  const [inputParams, setInputParams] = useState([]);
  const [outputParams, setOutputParams] = useState([]);
  const [showWorkflowSettings, setShowWorkflowSettings] = useState(false);
  const [showUserManual, setShowUserManual] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [smartHintsEnabled, setSmartHintsEnabled] = useState(() => {
    const saved = localStorage.getItem('smartHintsEnabled');
    return saved !== null ? JSON.parse(saved) : false; // 預設關閉
  });
  const [showHintsPrompt, setShowHintsPrompt] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showWebhookUrl, setShowWebhookUrl] = useState(false);
  const [executionResults, setExecutionResults] = useState(null);
  const [showExecutionResults, setShowExecutionResults] = useState(false);
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  
  // 調試狀態
  const [debugSession, setDebugSession] = useState(null);
  const [debugStatus, setDebugStatus] = useState('stopped');
  const [currentExecutingNode, setCurrentExecutingNode] = useState(null);
  const [breakpoints, setBreakpoints] = useState(new Set());
  const [debugVariables, setDebugVariables] = useState({});
  const [showVariableInspector, setShowVariableInspector] = useState(false);
  const [callStack, setCallStack] = useState([]);

  // 通知系統
  const showNotification = (type, title, message = '') => {
    const id = Date.now();
    const notification = { id, type, title, message };
    setNotifications(prev => [...prev, notification]);
    
    // 自動移除通知 - 錯誤訊息顯示更久
    setTimeout(() => {
      removeNotification(id);
    }, type === 'error' ? 10000 : 4000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 儲存智能提示設定到本地儲存
  useEffect(() => {
    localStorage.setItem('smartHintsEnabled', JSON.stringify(smartHintsEnabled));
  }, [smartHintsEnabled]);

  // 每次開啟頁面都檢查是否需要顯示智能提示啟用提醒
  useEffect(() => {
    if (!smartHintsEnabled) {
      setShowHintsPrompt(true);
    }
  }, []);

  const handleEnableSmartHints = () => {
    setSmartHintsEnabled(true);
    setShowHintsPrompt(false);
  };

  const handleDismissPrompt = () => {
    setShowHintsPrompt(false);
  };
  const { project } = useReactFlow();

  const handleParamsChange = (newInputParams, newOutputParams) => {
    setInputParams(newInputParams);
    setOutputParams(newOutputParams);
    setHasUnsavedChanges(true);
  };

  const handleNodesChange = useCallback((changes) => {
    // 處理拖拽狀態
    const updatedChanges = changes.map(change => {
      if (change.type === 'position' && change.dragging !== undefined) {
        return {
          ...change,
          item: change.item ? {
            ...change.item,
            className: change.dragging 
              ? `${change.item.className || ''} dragging`.trim()
              : (change.item.className || '').replace(' dragging', '')
          } : change.item
        };
      }
      return change;
    });
    
    onNodesChange(updatedChanges);
    // 只有在用戶主動操作時才標記為未儲存，排除初始化和載入時的變更
    const isUserAction = changes.some(change => 
      change.type === 'position' || 
      change.type === 'remove' || 
      (change.type === 'add' && change.item)
    );
    if (isUserAction) {
      setHasUnsavedChanges(true);
    }
  }, [onNodesChange]);

  const onConnect = useCallback((params) => {
    // 檢查來源節點是否為條件節點
    const sourceNode = nodes.find(n => n.id === params.source);
    const isConditionNode = sourceNode && (sourceNode.data.type === 'condition' || sourceNode.data.type === 'if-condition');
    const isSwitchNode = sourceNode && sourceNode.data.type === 'switch';
    
    // 為條件節點的邊設定預設分支
    let edgeData = { active: true };
    let edgeStyle = { ...defaultEdgeOptions.style };
    let edgeLabel = '';
    
    if (isConditionNode) {
      // 檢查是否已經有TRUE分支
      const existingEdges = edges.filter(e => e.source === params.source);
      const hasTrueBranch = existingEdges.some(e => e.data?.branch === 'true' || !e.data?.branch);
      
      // 如果已經有TRUE分支，新邊設為FALSE分支
      const branch = hasTrueBranch ? 'false' : 'true';
      edgeData.branch = branch;
      edgeLabel = branch === 'true' ? '✅' : '❌';
      edgeStyle = {
        ...edgeStyle,
        stroke: branch === 'true' ? '#4CAF50' : '#f44336',
        strokeWidth: 4,
        strokeDasharray: '8,4'
      };
    } else if (isSwitchNode) {
      // Switch節點的分支處理
      const existingEdges = edges.filter(e => e.source === params.source);
      const cases = sourceNode.data.cases || [];
      const usedBranches = existingEdges.map(e => e.data?.branch).filter(Boolean);
      
      // 找到下一個可用的case或default
      let nextBranch = 'default';
      for (const caseItem of cases) {
        if (!usedBranches.includes(caseItem.value)) {
          nextBranch = caseItem.value;
          break;
        }
      }
      
      edgeData.branch = nextBranch;
      edgeLabel = nextBranch === 'default' ? '🛡️' : nextBranch;
      edgeStyle = {
        ...edgeStyle,
        stroke: nextBranch === 'default' ? '#FF9800' : '#2196F3',
        strokeWidth: 4,
        strokeDasharray: '8,4'
      };
    }
    
    const newEdge = {
      ...params, 
      ...defaultEdgeOptions, 
      data: edgeData,
      style: edgeStyle,
      label: edgeLabel
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
    setHasUnsavedChanges(true);
  }, [setEdges, nodes, edges]);

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
      min-width: 160px;
    `;
    
    // 檢查來源節點是否為條件節點
    const sourceNode = nodes.find(n => n.id === edge.source);
    const isConditionNode = sourceNode && (sourceNode.data.type === 'condition' || sourceNode.data.type === 'if-condition');
    const isSwitchNode = sourceNode && sourceNode.data.type === 'switch';
    
    // 分支設定按鈕（條件節點和Switch節點）
    if (isConditionNode || isSwitchNode) {
      const branchBtn = document.createElement('button');
      const currentBranch = edge.data?.branch || 'true';
      if (isConditionNode) {
        branchBtn.textContent = currentBranch === 'true' ? '🟢 TRUE分支' : '🔴 FALSE分支';
      } else {
        branchBtn.textContent = `🔀 ${currentBranch}分支`;
      }
      branchBtn.style.cssText = `
        width: 100%;
        padding: 8px 16px;
        background: none;
        border: none;
        color: #e0e0e0;
        cursor: pointer;
        text-align: left;
      `;
      branchBtn.onmouseover = () => branchBtn.style.background = '#404040';
      branchBtn.onmouseout = () => branchBtn.style.background = 'none';
      branchBtn.onclick = () => {
        if (isConditionNode) {
          const newBranch = currentBranch === 'true' ? 'false' : 'true';
          setEdges((eds) => eds.map((e) => 
            e.id === edge.id 
              ? { 
                  ...e, 
                  data: { ...e.data, branch: newBranch },
                  label: newBranch === 'true' ? '✅' : '❌',
                  style: {
                    ...e.style,
                    stroke: newBranch === 'true' ? '#4CAF50' : '#f44336',
                    strokeWidth: 4,
                    strokeDasharray: '8,4'
                  }
                }
              : e
          ));
        } else {
          // Switch節點的分支切換
          const cases = sourceNode.data.cases || [];
          const allBranches = [...cases.map(c => c.value), 'default'];
          const currentIndex = allBranches.indexOf(currentBranch);
          const nextIndex = (currentIndex + 1) % allBranches.length;
          const newBranch = allBranches[nextIndex];
          
          setEdges((eds) => eds.map((e) => 
            e.id === edge.id 
              ? { 
                  ...e, 
                  data: { ...e.data, branch: newBranch },
                  label: newBranch === 'default' ? '🛡️' : newBranch,
                  style: {
                    ...e.style,
                    stroke: newBranch === 'default' ? '#FF9800' : '#2196F3',
                    strokeWidth: 4,
                    strokeDasharray: '8,4'
                  }
                }
              : e
          ));
        }
        setHasUnsavedChanges(true);
        document.body.removeChild(menu);
      };
      menu.appendChild(branchBtn);
    }
    
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
        'if-condition': { label: 'IF條件', conditions: [{field: '{message}', operator: 'contains', value: '你好'}], logic: 'AND' },
        'switch': { label: 'Switch分支', switchField: '{message}', cases: [{value: '你好', label: '問候'}, {value: '再見', label: '告別'}], defaultCase: '其他' },
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
        'program-entry': { label: '程式進入點', name: '開始', description: '流程的起始點' },
        'notification': { label: '顯示訊息', message: '' },
        'existing-workflow': { label: '現有流程', workflowId: '', workflowName: '請選擇流程', paramMappings: [] }
      };

      const nodeData = defaultData[type] || { label: type };
      const newNode = {
        id: `${type}-${Date.now()}`,
        type: 'default',
        position,
        data: {
          type,
          ...nodeData,
          label: getNodeDisplayLabel(type, nodeData)
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
    
    const nodeData = { ...data };
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'default',
      position,
      data: { 
        type,
        ...nodeData,
        label: getNodeDisplayLabel(type, nodeData)
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

  // 斷點管理
  const toggleBreakpoint = useCallback((nodeId) => {
    setBreakpoints(prev => {
      const newBreakpoints = new Set(prev);
      if (newBreakpoints.has(nodeId)) {
        newBreakpoints.delete(nodeId);
      } else {
        newBreakpoints.add(nodeId);
      }
      return newBreakpoints;
    });
  }, []);

  // 節點右鍵選單
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    const hasBreakpoint = breakpoints.has(node.id);
    
    // 創建右鍵選單
    const menu = document.createElement('div');
    menu.className = 'node-context-menu';
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
    
    const breakpointBtn = document.createElement('button');
    breakpointBtn.textContent = hasBreakpoint ? '🔴 移除斷點' : '🔴 設置斷點';
    breakpointBtn.style.cssText = `
      width: 100%;
      padding: 8px 16px;
      background: none;
      border: none;
      color: #e0e0e0;
      cursor: pointer;
      text-align: left;
    `;
    breakpointBtn.onclick = () => {
      toggleBreakpoint(node.id);
      document.body.removeChild(menu);
    };
    
    menu.appendChild(breakpointBtn);
    document.body.appendChild(menu);
    
    const closeMenu = () => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
      document.removeEventListener('click', closeMenu);
    };
    
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
  }, [breakpoints, toggleBreakpoint]);

  const createGroup = () => {
    if (selectedNodes.length < 2) {
      showNotification('warning', '請選擇至少2個節點進行分組');
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
      
      case 'if-condition':
        const conditionCount = (data.conditions || []).length;
        const logic = data.logic || 'AND';
        return `IF條件 (${conditionCount}個 ${logic})`;
      
      case 'switch':
        const caseCount = (data.cases || []).length;
        return `Switch分支 (${caseCount}個選項)`;
      
      case 'line-reply':
        const replyText = data.body?.messages?.[0]?.text || '';
        return `LINE回覆: ${replyText.substring(0, 15)}${replyText.length > 15 ? '...' : ''}`;
      
      case 'line-push':
        const pushText = data.body?.messages?.[0]?.text || '';
        return `LINE推送: ${pushText.substring(0, 15)}${pushText.length > 15 ? '...' : ''}`;
      
      case 'line-carousel':
        const columnCount = data.body?.messages?.[0]?.template?.columns?.length || 0;
        return `LINE多頁 (${columnCount}張卡片)`;
      
      case 'http-request':
        const method = data.method || 'GET';
        const url = data.url || '';
        return `${method} ${url.substring(0, 20)}${url.length > 20 ? '...' : ''}`;
      
      case 'data-map':
        const mappingCount = (data.mappings || []).length;
        return `資料映射 (${mappingCount}個對應)`;
      
      case 'notification':
        const message = data.message || '';
        return `通知: ${message.substring(0, 15)}${message.length > 15 ? '...' : ''}`;
      
      case 'program-entry':
        return data.name || '程式進入點';
      
      case 'webhook-trigger':
        return data.name || 'Webhook觸發';
      
      case 'existing-workflow':
      case 'workflow-reference':
        return data.workflowName || '現有流程';
      
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

  const handleSaveWorkflow = async () => {
    try {
      if (workflowId) {
        await fetch(`${API_BASE_URL}/api/workflows/${workflowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: currentWorkflowName,
            nodes, 
            edges, 
            nodeGroups, 
            inputParams, 
            outputParams 
          })
        });
      } else {
        const response = await fetch(`${API_BASE_URL}/api/workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: currentWorkflowName, 
            nodes, 
            edges, 
            nodeGroups, 
            inputParams, 
            outputParams 
          })
        });
        const data = await response.json();
        setWorkflowId(data.workflowId);
      }
      setHasUnsavedChanges(false);
      showNotification('success', '流程已儲存');
    } catch (error) {
      showNotification('error', '儲存失敗', error.message);
    }
  };

  const handleExecuteWorkflow = async (inputData = {}) => {
    if (!workflowId) {
      showNotification('warning', '請先儲存流程');
      return;
    }
    
    setIsExecuting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/execute/${workflowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputData })
      });
      const result = await response.json();
      
      console.log('執行結果:', result);
      
      // 儲存執行結果並顯示結果視窗
      if (result.results && result.results.length > 0) {
        setExecutionResults(result.results);
        setShowExecutionResults(true);
        
        const failedSteps = result.results.filter(r => !r.result.success);
        if (failedSteps.length > 0) {
          showNotification('error', `流程執行完成 (${failedSteps.length}/${result.results.length} 步驟失敗)`);
        } else {
          showNotification('success', `流程執行成功 (${result.results.length} 步驟完成)`);
        }
      } else if (result.success) {
        showNotification('success', '流程執行成功');
      } else {
        showNotification('error', '流程執行失敗', result.error || '未知錯誤');
      }
    } catch (error) {
      showNotification('error', '執行失敗', error.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleValidateWorkflow = () => {
    const issues = [];
    
    // 檢查是否有節點
    if (nodes.length === 0) {
      issues.push('流程中沒有任何節點');
    }
    
    // 檢查孤立節點
    const isolatedNodes = nodes.filter(node => {
      const hasIncoming = edges.some(edge => edge.target === node.id);
      const hasOutgoing = edges.some(edge => edge.source === node.id);
      return !hasIncoming && !hasOutgoing && node.data.type !== 'webhook-trigger' && node.data.type !== 'program-entry';
    });
    
    if (isolatedNodes.length > 0) {
      issues.push(`發現 ${isolatedNodes.length} 個孤立節點`);
    }
    
    // 檢查必填欄位
    const incompleteNodes = nodes.filter(node => {
      switch (node.data.type) {
        case 'http-request':
          return !node.data.url;
        case 'condition':
          return !node.data.field || !node.data.operator;
        case 'if-condition':
          return !node.data.conditions || node.data.conditions.length === 0 || 
                 node.data.conditions.some(c => !c.field || !c.operator);
        case 'switch':
          return !node.data.switchField || !node.data.cases || node.data.cases.length === 0;
        case 'line-reply':
        case 'line-push':
          return !node.data.body?.messages?.[0]?.text;
        case 'line-carousel':
          return !node.data.body?.messages?.[0]?.template?.columns || 
                 node.data.body.messages[0].template.columns.length === 0;
        case 'notification':
          return !node.data.message;
        case 'data-map':
          return !node.data.mappings || node.data.mappings.length === 0 || 
                 node.data.mappings.some(m => !m.from || !m.to);
        case 'existing-workflow':
        case 'workflow-reference':
          return !node.data.workflowId;
        default:
          return false;
      }
    });
    
    if (incompleteNodes.length > 0) {
      issues.push(`發現 ${incompleteNodes.length} 個配置不完整的節點`);
    }
    
    if (issues.length === 0) {
      showNotification('success', '流程驗證通過', '沒有發現問題');
    } else {
      showNotification('warning', '發現流程問題', issues.join('\n'));
    }
  };

  const handleSelectWorkflow = async (selectedWorkflowId) => {
    try {
      // 同時獲取流程數據和元數據
      const [workflowResponse, metadataResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/workflows/${selectedWorkflowId}`),
        fetch(`${API_BASE_URL}/api/workflows`)
      ]);
      
      const workflow = await workflowResponse.json();
      const metadataList = await metadataResponse.json();
      
      // 從元數據中找到對應的流程名稱
      const workflowMetadata = metadataList.workflows.find(w => w.id === selectedWorkflowId);
      const workflowName = workflowMetadata?.name || workflow.name || '流程';
      
      // 為現有節點添加className和連接點位置
      const nodesWithType = (workflow.nodes || []).map(node => ({
        ...node,
        className: node.type === 'group' ? 'node-group' : `node-${node.data?.type || 'default'}`,
        sourcePosition: node.type === 'group' ? undefined : 'right',
        targetPosition: node.type === 'group' ? undefined : 'left',
        style: node.style
      }));
      
      setNodes(nodesWithType);
      setEdges(workflow.edges || []);
      setNodeGroups(workflow.nodeGroups || {});
      setInputParams(workflow.inputParams || []);
      setOutputParams(workflow.outputParams || []);
      setWorkflowId(selectedWorkflowId);
      setCurrentWorkflowName(workflowName);
      // 延遲設置以確保所有狀態更新完成後再重置未儲存標記
      setTimeout(() => setHasUnsavedChanges(false), 100);
    } catch (error) {
      console.error('載入流程失敗:', error);
      showNotification('error', '載入流程失敗', error.message);
    }
  };

  const handleNewWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setNodeGroups({});
    setInputParams([]);
    setOutputParams([]);
    setWorkflowId(null);
    setCurrentWorkflowName('新流程');
    setHasUnsavedChanges(false);
  };

  // 調試控制函數
  const startDebugSession = async () => {
    if (!workflowId) {
      showNotification('warning', '請先儲存流程');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug/start/${workflowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputData: {},
          breakpoints: Array.from(breakpoints),
          stepMode: true
        })
      });
      
      const session = await response.json();
      setDebugSession(session);
      setDebugStatus('ready');
      setShowVariableInspector(true); // 自動顯示變數檢視器
      showNotification('success', '調試會話已啟動');
    } catch (error) {
      showNotification('error', '啟動調試失敗', error.message);
    }
  };

  const stepExecution = async () => {
    if (!debugSession) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug/step/${debugSession.sessionId}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      setCurrentExecutingNode(result.currentNode);
      setDebugVariables(result.variables || {});
      setDebugStatus(result.status);
      setCallStack(result.callStack || []);
      
      if (result.message) {
        showNotification('info', result.message);
      }
    } catch (error) {
      showNotification('error', '單步執行失敗', error.message);
    }
  };

  const continueExecution = async () => {
    if (!debugSession) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/debug/continue/${debugSession.sessionId}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      setDebugStatus(result.status);
      setCurrentExecutingNode(result.currentNode);
    } catch (error) {
      showNotification('error', '繼續執行失敗', error.message);
    }
  };

  const pauseExecution = async () => {
    if (!debugSession) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/debug/pause/${debugSession.sessionId}`, {
        method: 'POST'
      });
      setDebugStatus('paused');
    } catch (error) {
      showNotification('error', '暫停執行失敗', error.message);
    }
  };

  const stopExecution = async () => {
    if (!debugSession) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/debug/stop/${debugSession.sessionId}`, {
        method: 'POST'
      });
      setDebugSession(null);
      setDebugStatus('stopped');
      setCurrentExecutingNode(null);
      setDebugVariables({});
      setCallStack([]);
      // 不自動關閉面板，讓用戶手動關閉
    } catch (error) {
      showNotification('error', '停止執行失敗', error.message);
    }
  };



  // 節點樣式更新（主要用於其他樣式，調試樣式由 CSS 類別處理）
  const getNodeStyle = (node) => {
    const baseStyle = {};
    
    // 其他自定義樣式可以在這裡添加
    
    return baseStyle;
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
            showNotification={showNotification}
          />
          {sidebarMode === 'full' && (
            <WorkflowStatus
              nodes={nodes}
              edges={edges}
              workflowId={workflowId}
              hasUnsavedChanges={hasUnsavedChanges}
              mode="embedded"
            />
          )}
          <NodePanel onAddNode={addNode} compact={sidebarMode === 'compact'} />
          {sidebarMode === 'full' ? (
            <ExecutePanel 
              nodes={nodes} 
              edges={edges}
              workflowId={workflowId}
              setWorkflowId={setWorkflowId}
              workflowName={currentWorkflowName}
              hasUnsavedChanges={hasUnsavedChanges}
              setHasUnsavedChanges={setHasUnsavedChanges}
              nodeGroups={nodeGroups}
              inputParams={inputParams}
              outputParams={outputParams}
              showNotification={showNotification}
            />
          ) : sidebarMode === 'compact' && (
            <div style={{padding: '10px', textAlign: 'center'}}>
              <button 
                onClick={async () => {
                  try {
                    if (workflowId) {
                      await fetch(`${API_BASE_URL}/api/workflows/${workflowId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nodes, edges, nodeGroups, inputParams, outputParams })
                      });
                    } else {
                      const response = await fetch(`${API_BASE_URL}/api/workflows`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: '新流程', nodes, edges, nodeGroups, inputParams, outputParams })
                      });
                      const data = await response.json();
                      setWorkflowId(data.workflowId);
                    }
                    setHasUnsavedChanges(false);
                  } catch (error) {
                    showNotification('error', '儲存失敗', error.message);
                  }
                }}
                className={`toolbar-btn ${hasUnsavedChanges ? 'save-btn-highlight' : ''}`}
                title="儲存流程"
              >
                💾
              </button>
            </div>
          )}

        </div>
      )}
      
      {/* 精簡和隱藏模式時的狀態面板 - 浮動於左下方 */}
      {(sidebarMode === 'compact' || sidebarMode === 'hidden') && (
        <div className={`workflow-status-floating ${sidebarMode}-mode`}>
          <WorkflowStatus
            nodes={nodes}
            edges={edges}
            workflowId={workflowId}
            hasUnsavedChanges={hasUnsavedChanges}
            mode="floating"
          />
        </div>
      )}
      

      <div className="flow-container">
        {hasUnsavedChanges && (
          <div className="unsaved-warning-overlay">
            ⚠️ 有未儲存的變更，請先儲存流程
          </div>
        )}
        
        {/* 流程設定按鈕 */}
        {/* 快速操作工具列 */}
        <QuickActions
          onSaveWorkflow={handleSaveWorkflow}
          onExecuteWorkflow={() => {
            if (inputParams.length > 0) {
              setShowExecuteDialog(true);
            } else {
              handleExecuteWorkflow();
            }
          }}
          onValidateWorkflow={handleValidateWorkflow}
          hasUnsavedChanges={hasUnsavedChanges}
          isExecuting={isExecuting}
          smartHintsEnabled={smartHintsEnabled}
          onToggleSmartHints={() => setSmartHintsEnabled(!smartHintsEnabled)}
          onOpenSettings={() => setShowWorkflowSettings(true)}
          onOpenManual={() => setShowUserManual(true)}
          workflowId={workflowId}
          onShowWebhookUrl={() => setShowWebhookUrl(true)}
          debugSession={debugSession}
          onShowVariableInspector={() => setShowVariableInspector(true)}
          onStartDebug={startDebugSession}
          isDebugging={debugSession !== null}
          debugControls={{
            onStop: stopExecution
          }}
        />
        

        

        
        {/* 智能提示面板 */}
        {smartHintsEnabled && (
          <SmartHints
            nodes={nodes}
            selectedNode={selectedNode}
            showNotification={showNotification}
          />
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
          nodes={nodes.map(node => {
            let className = node.className || `node-${node.data?.type || 'default'}`;
            
            // 添加調試狀態的 className
            if (breakpoints.has(node.id)) {
              className += ' debug-breakpoint';
            }
            if (currentExecutingNode === node.id) {
              className += ' debug-executing';
            }
            
            return {
              ...node,
              className,
              style: { ...node.style, ...getNodeStyle(node) }
            };
          })}
          edges={edges.map(edge => {
            let className = edge.data?.active === false ? 'paused-edge' : '';
            
            // 為分支邊添加樣式
            if (edge.data?.branch) {
              className += ` branch-${edge.data.branch}`;
            }
            
            return {
              ...edge,
              className: className.trim()
            };
          })}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
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
          showNotification={showNotification}
        />
        
        <WorkflowSettings
          isOpen={showWorkflowSettings}
          onClose={() => setShowWorkflowSettings(false)}
          workflowName={currentWorkflowName}
          onWorkflowNameChange={setCurrentWorkflowName}
          inputParams={inputParams}
          outputParams={outputParams}
          onParamsChange={handleParamsChange}
          workflowId={workflowId}
        />
        
        <UserManual
          isOpen={showUserManual}
          onClose={() => setShowUserManual(false)}
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
        
        {showHintsPrompt && (
          <div className="dialog-overlay">
            <div className="dialog smart-hints-prompt">
              <div className="prompt-icon">💡</div>
              <h4>啟用智能提示？</h4>
              <p>智能提示可以幫助您：</p>
              <ul>
                <li>• 即時發現流程問題</li>
                <li>• 提供最佳實踐建議</li>
                <li>• 優化流程設計</li>
              </ul>
              <p className="prompt-note">您可以隨時在工具列中開啟/關閉此功能</p>
              <div className="dialog-buttons">
                <button onClick={handleEnableSmartHints} className="primary-btn">啟用智能提示</button>
                <button onClick={handleDismissPrompt}>略過</button>
              </div>
            </div>
          </div>
        )}
        
        <Notification
          notifications={notifications}
          onRemove={removeNotification}
        />
        
        <WebhookUrlDialog
          isOpen={showWebhookUrl}
          onClose={() => setShowWebhookUrl(false)}
          workflowId={workflowId}
        />
        
        <ExecutionResults
          isOpen={showExecutionResults}
          onClose={() => setShowExecutionResults(false)}
          results={executionResults}
          nodes={nodes}
        />
        
        <ExecuteDialog
          isOpen={showExecuteDialog}
          onClose={() => setShowExecuteDialog(false)}
          onExecute={handleExecuteWorkflow}
          inputParams={inputParams}
        />
        
        <VariableInspector
          isOpen={showVariableInspector}
          onClose={() => setShowVariableInspector(false)}
          variables={debugVariables}
          context={debugVariables}
          isDebugging={debugSession !== null}
          debugControls={{
            onStep: stepExecution,
            onContinue: continueExecution,
            onPause: pauseExecution,
            onStop: stopExecution
          }}
        />
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