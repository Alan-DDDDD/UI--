const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();

// CORS設定
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// 資料管理
const DATA_DIR = path.join(process.cwd(), 'data');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

// 確保資料目錄存在
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (error) {
  console.log('無法創建資料目錄，使用記憶體存儲');
}

// 載入/儲存函數
function loadData(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.log(`載入 ${filePath} 失敗，使用預設值`);
  }
  return defaultValue;
}

function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`儲存 ${filePath} 失敗`);
  }
}

// 初始化資料
let workflows = loadData(WORKFLOWS_FILE, {});
let workflowMetadata = loadData(METADATA_FILE, {});
let tokens = loadData(TOKENS_FILE, {});

// API端點
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// 工作流程API
app.get('/api/workflows', (req, res) => {
  const workflowList = Object.values(workflowMetadata).sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
  res.json({ workflows: workflowList });
});

app.get('/api/workflows/:workflowId', (req, res) => {
  const workflow = workflows[req.params.workflowId];
  if (!workflow) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  res.json(workflow);
});

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

// Token管理API
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

// 執行工作流程API
app.post('/api/execute/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const { inputData } = req.body;
  
  const workflow = workflows[workflowId];
  if (!workflow) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  
  // 簡化執行邏輯
  const results = [];
  let context = { ...inputData };
  
  try {
    for (const node of workflow.nodes || []) {
      const result = {
        success: true,
        data: { 
          type: node.data?.type || 'unknown',
          message: `節點 ${node.id} 執行成功`,
          timestamp: new Date().toISOString()
        }
      };
      results.push({ nodeId: node.id, result });
      context._lastResult = result;
    }
    
    res.json({ 
      success: true, 
      results, 
      finalContext: context,
      executedNodes: results.length
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
  
  // 簡化處理邏輯
  if (lineData.events && lineData.events.length > 0) {
    for (const event of lineData.events) {
      console.log(`處理事件: ${event.type}, 訊息: ${event.message?.text}`);
    }
  }
  
  res.status(200).json({ message: 'ok' });
});

// 通用Webhook端點
app.post('/webhook/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  console.log(`🔗 收到Webhook: ${workflowId}`);
  res.status(200).json({ message: 'webhook received' });
});

module.exports = app;