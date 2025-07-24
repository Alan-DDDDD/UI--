// 從 server.js 複製完整的後端邏輯
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();

// 執行狀態管理
class ExecutionState {
  constructor(workflowId, inputData) {
    this.sessionId = uuidv4();
    this.workflowId = workflowId;
    this.status = 'ready';
    this.currentNodeIndex = 0;
    this.currentNodeId = null;
    this.context = { ...inputData };
    this.results = [];
    this.breakpoints = new Set();
    this.stepMode = false;
    this.variables = {};
    this.callStack = [];
    this.parentSession = null;
    this.depth = 0;
    this.nodes = [];
  }
}

const executionSessions = new Map();

app.use(cors({
  origin: ['https://alan-ddddd.github.io', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 資料檔案路徑 - Vercel適配
let DATA_DIR, WORKFLOWS_FILE, METADATA_FILE, TOKENS_FILE;

// 嘗試不同的路徑配置
const possiblePaths = [
  path.join(__dirname, '..', 'data'),  // 本地開發
  path.join(process.cwd(), 'data'),    // Vercel部署
  path.join(__dirname, 'data')         // 備用路徑
];

for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    DATA_DIR = testPath;
    break;
  }
}

// 如果找不到資料目錄，使用預設路徑並創建
if (!DATA_DIR) {
  DATA_DIR = possiblePaths[1]; // 使用 process.cwd()
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');
METADATA_FILE = path.join(DATA_DIR, 'metadata.json');
TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

console.log('📁 資料目錄:', DATA_DIR);
console.log('📄 檔案存在:', {
  workflows: fs.existsSync(WORKFLOWS_FILE),
  metadata: fs.existsSync(METADATA_FILE),
  tokens: fs.existsSync(TOKENS_FILE)
});

// 載入資料
let workflows = loadData(WORKFLOWS_FILE, {});
let workflowMetadata = loadData(METADATA_FILE, {});
let tokens = loadData(TOKENS_FILE, {});

// 載入資料函數
function loadData(filePath, defaultValue) {
  try {
    console.log(`🔍 嘗試載入: ${filePath}`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ 成功載入: ${filePath}, 資料筆數: ${Object.keys(data).length}`);
      return data;
    } else {
      console.log(`⚠️ 檔案不存在: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ 載入 ${filePath} 失敗:`, error.message);
  }
  console.log(`🔄 使用預設值: ${filePath}`);
  return defaultValue;
}

// 儲存資料函數
function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`儲存 ${filePath} 失敗:`, error);
  }
}

// 執行單個節點 - 簡化版本，只包含核心功能
async function executeNode(node, context) {
  const nodeType = node.data.type || node.type;
  switch (nodeType) {
    case 'http-request':
      const { method, url, headers, body } = node.data;
      try {
        const response = await axios({
          method: method || 'GET',
          url,
          headers: headers || {},
          data: body
        });
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    
    case 'notification':
      const { message } = node.data;
      return { 
        success: true, 
        data: { 
          type: 'notification',
          message,
          timestamp: new Date().toISOString()
        }
      };
    
    default:
      return { success: false, error: '未知的節點類型' };
  }
}

// Token 管理 API
app.get('/api/tokens', (req, res) => {
  const tokenList = Object.entries(tokens).map(([key, value]) => ({
    key,
    name: value.name,
    masked: value.token.substring(0, 8) + '...'
  }));
  res.json({ tokens: tokenList });
});

app.post('/api/tokens', (req, res) => {
  const { key, name, token } = req.body;
  if (!key || !token) {
    return res.status(400).json({ error: '缺少必要參數' });
  }
  
  tokens[key] = { name: name || key, token };
  saveData(TOKENS_FILE, tokens);
  res.json({ success: true, message: 'Token 已儲存' });
});

app.delete('/api/tokens/:key', (req, res) => {
  const { key } = req.params;
  if (tokens[key]) {
    delete tokens[key];
    saveData(TOKENS_FILE, tokens);
    res.json({ success: true, message: 'Token 已刪除' });
  } else {
    res.status(404).json({ error: 'Token 不存在' });
  }
});

// 獲取所有工作流程列表
app.get('/api/workflows', (req, res) => {
  const workflowList = Object.values(workflowMetadata).sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
  res.json({ workflows: workflowList });
});

// 獲取工作流程
app.get('/api/workflows/:workflowId', (req, res) => {
  const workflow = workflows[req.params.workflowId];
  if (!workflow) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  res.json(workflow);
});

// 儲存工作流程
app.post('/api/workflows', (req, res) => {
  const workflowId = uuidv4();
  const { name, description, inputParams, outputParams, ...workflowData } = req.body;
  
  workflows[workflowId] = {
    ...workflowData,
    inputParams: inputParams || [],
    outputParams: outputParams || []
  };
  workflowMetadata[workflowId] = {
    id: workflowId,
    name: name || '新流程',
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: workflowData.nodes?.length || 0,
    inputParams: inputParams || [],
    outputParams: outputParams || []
  };
  
  saveData(WORKFLOWS_FILE, workflows);
  saveData(METADATA_FILE, workflowMetadata);
  
  res.json({ workflowId, ...workflowMetadata[workflowId] });
});

// 更新工作流程
app.put('/api/workflows/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  const { name, description, inputParams, outputParams, ...workflowData } = req.body;
  
  if (!workflows[workflowId]) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  
  workflows[workflowId] = {
    ...workflowData,
    inputParams: inputParams || [],
    outputParams: outputParams || []
  };
  workflowMetadata[workflowId] = {
    ...workflowMetadata[workflowId],
    name: name || workflowMetadata[workflowId].name,
    description: description || workflowMetadata[workflowId].description,
    updatedAt: new Date().toISOString(),
    nodeCount: workflowData.nodes?.length || 0,
    inputParams: inputParams || [],
    outputParams: outputParams || []
  };
  
  saveData(WORKFLOWS_FILE, workflows);
  saveData(METADATA_FILE, workflowMetadata);
  
  res.json({ success: true, ...workflowMetadata[workflowId] });
});

// 刪除工作流程
app.delete('/api/workflows/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  
  if (!workflows[workflowId]) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  
  delete workflows[workflowId];
  delete workflowMetadata[workflowId];
  
  saveData(WORKFLOWS_FILE, workflows);
  saveData(METADATA_FILE, workflowMetadata);
  
  res.json({ success: true, message: '工作流程已刪除' });
});

// 執行工作流程
app.post('/api/execute/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const { inputData } = req.body;
  
  const workflow = workflows[workflowId];
  if (!workflow) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  
  let context = { ...inputData };
  const results = [];
  
  try {
    for (const node of workflow.nodes) {
      const result = await executeNode(node, context);
      results.push({ nodeId: node.id, result });
      
      if (result.success) {
        context[node.id] = result.data;
        context._lastResult = result;
      } else {
        context._lastResult = result;
        break;
      }
    }
    
    const hasFailedNode = results.some(r => !r.result.success);
    res.json({ 
      success: !hasFailedNode, 
      results, 
      finalContext: context,
      executedNodes: results.length,
      error: hasFailedNode ? '流程執行中有節點失敗' : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LINE Webhook端點
app.post('/webhook/line/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const lineData = req.body;
  
  console.log(`📱 收到LINE Webhook: ${workflowId}`);
  
  if (lineData.events && lineData.events.length > 0) {
    for (const event of lineData.events) {
      const eventData = {
        type: event.type,
        userId: event.source?.userId,
        message: event.message?.text,
        replyToken: event.replyToken,
        timestamp: event.timestamp
      };
      
      const workflow = workflows[workflowId];
      if (workflow) {
        try {
          let context = { ...eventData };
          const results = [];
          
          for (const node of workflow.nodes) {
            const result = await executeNode(node, context);
            results.push({ nodeId: node.id, result });
            
            if (result.success) {
              context[node.id] = result.data;
              context._lastResult = result;
            } else {
              context._lastResult = result;
              break;
            }
          }
          
          console.log('🚀 LINE Webhook觸發工作流程執行完成');
        } catch (error) {
          console.error('❌ LINE Webhook執行失敗:', error);
        }
      }
    }
  }
  
  res.status(200).json({ message: 'ok' });
});

module.exports = app;" / /   F o r c e   d e p l o y "    
 