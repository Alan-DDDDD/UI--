const fs = require('fs');
const path = require('path');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 資料檔案路徑
const DATA_DIR = path.join(process.cwd(), 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

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

module.exports = function handler(req, res) {
  // 設置 CORS headers
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let tokens = loadData(TOKENS_FILE, {});

  if (req.method === 'GET') {
    const tokenList = Object.entries(tokens).map(([key, value]) => ({
      key,
      name: value.name,
      masked: value.token.substring(0, 8) + '...'
    }));
    res.status(200).json({ tokens: tokenList });
  } else if (req.method === 'POST') {
    const { key, name, token } = req.body;
    if (!key || !token) {
      return res.status(400).json({ error: '缺少必要參數' });
    }
    
    tokens[key] = { name: name || key, token };
    saveData(TOKENS_FILE, tokens);
    res.status(200).json({ success: true, message: 'Token 已儲存' });
  } else if (req.method === 'DELETE') {
    const { key } = req.query;
    if (tokens[key]) {
      delete tokens[key];
      saveData(TOKENS_FILE, tokens);
      res.status(200).json({ success: true, message: 'Token 已刪除' });
    } else {
      res.status(404).json({ error: 'Token 不存在' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}