const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// 資料檔案路徑
const DATA_DIR = path.join(process.cwd(), 'data');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

// 確保資料目錄存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 載入資料函數
function loadData(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
  } catch (error) {
    console.error(`載入 ${filePath} 失敗:`, error.message);
  }
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

// 載入資料
let workflows = loadData(WORKFLOWS_FILE, {});
let workflowMetadata = loadData(METADATA_FILE, {});
let tokens = loadData(TOKENS_FILE, {});

// API路由
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
  const { name, description, ...workflowData } = req.body;
  
  workflows[workflowId] = workflowData;
  workflowMetadata[workflowId] = {
    id: workflowId,
    name: name || '新流程',
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: workflowData.nodes?.length || 0
  };
  
  saveData(WORKFLOWS_FILE, workflows);
  saveData(METADATA_FILE, workflowMetadata);
  
  res.json({ workflowId, ...workflowMetadata[workflowId] });
});

app.put('/api/workflows/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  const { name, description, ...workflowData } = req.body;
  
  if (!workflows[workflowId]) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  
  workflows[workflowId] = workflowData;
  workflowMetadata[workflowId] = {
    ...workflowMetadata[workflowId],
    name: name || workflowMetadata[workflowId].name,
    description: description || workflowMetadata[workflowId].description,
    updatedAt: new Date().toISOString(),
    nodeCount: workflowData.nodes?.length || 0
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

// Token管理
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

// Webhook端點
app.post('/webhook/line/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const lineData = req.body;
  
  console.log(`📱 收到LINE Webhook: ${workflowId}`);
  res.status(200).json({ message: 'ok' });
});

module.exports = app;