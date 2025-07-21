const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 資料檔案路徑
const DATA_DIR = path.join(process.cwd(), 'data');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

// 確保資料目錄存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 載入資料函數
function loadData(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`載入 ${filePath} 失敗:`, error);
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

export default function handler(req, res) {
  // 設置 CORS headers
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let workflows = loadData(WORKFLOWS_FILE, {});
  let workflowMetadata = loadData(METADATA_FILE, {});

  if (req.method === 'GET') {
    const workflowList = Object.values(workflowMetadata).sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );
    res.status(200).json({ workflows: workflowList });
  } else if (req.method === 'POST') {
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
    
    res.status(200).json({ workflowId, ...workflowMetadata[workflowId] });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}