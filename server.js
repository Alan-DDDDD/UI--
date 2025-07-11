const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 資料檔案路徑
const DATA_DIR = path.join(__dirname, 'data');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

// 確保資料目錄存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// 載入資料
let workflows = loadData(WORKFLOWS_FILE, {});
let workflowMetadata = loadData(METADATA_FILE, {});
let tokens = loadData(TOKENS_FILE, {});

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

// 執行單個節點
async function executeNode(node, context) {
  const nodeType = node.data.type || node.type;
  switch (nodeType) {
    case 'http-request':
      const { method, url, headers, body, useDataFrom } = node.data;
      
      // 處理URL中的變數替換
      let processedUrl = url;
      if (context._lastResult && context._lastResult.data) {
        processedUrl = url.replace(/\{([^}]+)\}/g, (match, key) => {
          return context._lastResult.data[key] || match;
        });
      }
      
      // 決定要發送的資料
      let requestData = body || {};
      if (useDataFrom === 'previous' && context._lastResult && context._lastResult.data) {
        requestData = context._lastResult.data;
      }
      
      // 處理資料中的變數替換
      const replaceVariables = (obj) => {
        if (typeof obj === 'string') {
          return obj.replace(/\{([^}]+)\}/g, (match, key) => {
            // 優先從 context 取得
            if (context[key]) return context[key];
            // 再從 tokens 取得
            if (tokens[key]) return tokens[key].token;
            return match;
          });
        } else if (Array.isArray(obj)) {
          return obj.map(replaceVariables);
        } else if (typeof obj === 'object' && obj !== null) {
          const result = {};
          for (const [k, v] of Object.entries(obj)) {
            result[k] = replaceVariables(v);
          }
          return result;
        }
        return obj;
      };
      
      if (typeof requestData === 'object' && requestData !== null) {
        requestData = replaceVariables(requestData);
      }
      
      // 處理 headers 中的 Token
      if (headers && typeof headers === 'object') {
        for (const [key, value] of Object.entries(headers)) {
          if (typeof value === 'string') {
            headers[key] = replaceVariables(value);
          }
        }
      }
      
      console.log(`🌐 發送HTTP請求: ${method} ${processedUrl}`, requestData);
      
      try {
        const axiosConfig = {
          method: method || 'GET',
          url: processedUrl,
          headers: headers || {}
        };
        
        // 只有非POST/PUT/PATCH才使用data
        if (['POST', 'PUT', 'PATCH'].includes((method || 'GET').toUpperCase())) {
          axiosConfig.data = requestData;
        }
        
        console.log(`🌐 發送HTTP請求: ${method} ${processedUrl}`);
        console.log(`📦 Headers:`, headers);
        console.log(`📦 Data:`, requestData);
        
        const response = await axios(axiosConfig);
        console.log(`✅ HTTP請求成功: ${response.status}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.log(`❌ HTTP請求失敗: ${error.response?.status} ${error.message}`);
        if (error.response?.data) {
          console.log(`❌ 錯誤詳情:`, error.response.data);
        }
        return { success: false, error: `${error.response?.status || ''} ${error.message}` };
      }
    
    case 'condition':
      const { condition, field, operator, value } = node.data;
      
      // 新版條件判斷：支援欄位、運算子、值的結構化判斷
      if (field && operator && value !== undefined) {
        console.log(`📝 Context 資料:`, JSON.stringify(context, null, 2));
        let fieldValue;
        
        // 取得欄位值
        if (field.startsWith('{') && field.endsWith('}')) {
          const key = field.slice(1, -1);
          // 優先從 context 直接取得，再從 _lastResult.data 取得
          fieldValue = context[key] || context._lastResult?.data?.[key];
        } else {
          fieldValue = field;
        }
        
        // 執行判斷
        let result = false;
        switch (operator) {
          case '>':
            result = Number(fieldValue) > Number(value);
            break;
          case '<':
            result = Number(fieldValue) < Number(value);
            break;
          case '>=':
            result = Number(fieldValue) >= Number(value);
            break;
          case '<=':
            result = Number(fieldValue) <= Number(value);
            break;
          case '==':
          case '等於':
            result = String(fieldValue) === String(value);
            break;
          case '!=':
          case '不等於':
            result = String(fieldValue) !== String(value);
            break;
          case 'contains':
          case '包含':
            result = String(fieldValue).includes(String(value));
            break;
          case 'not_contains':
          case '不包含':
            result = !String(fieldValue).includes(String(value));
            break;
        }
        
        console.log(`🔍 條件判斷: ${fieldValue} ${operator} ${value} = ${result}`);
        return { success: true, data: result };
      }
      
      // 舊版條件判斷：支援自由表達式
      if (condition) {
        const processedCondition = condition
          .replace(/\$prev/g, 'context._lastResult')
          .replace(/\$\{(\w+)\}/g, (match, key) => {
            return JSON.stringify(context[key]);
          });
        const result = eval(processedCondition);
        return { success: true, data: result };
      }
      
      return { success: false, error: '條件判斷設定不完整' };
    
    case 'transform':
      const { script } = node.data;
      try {
        const func = new Function('context', 'console', script);
        const result = func(context, console);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    
    case 'notification':
      const { message } = node.data;
      console.log(`📢 系統訊息: ${message}`);
      return { 
        success: true, 
        data: { 
          type: 'notification',
          message,
          timestamp: new Date().toISOString()
        }
      };
    
    case 'data-map':
      const { mappings } = node.data;
      if (!context._lastResult || !context._lastResult.data) {
        return { success: false, error: '沒有前一步的資料可以映射' };
      }
      
      const sourceData = context._lastResult.data;
      const mappedData = {};
      
      mappings.forEach(mapping => {
        if (sourceData[mapping.from] !== undefined) {
          mappedData[mapping.to] = sourceData[mapping.from];
        }
      });
      
      return { success: true, data: mappedData };
    
    case 'webhook-trigger':
      // Webhook觸發節點只是標記，不做實際操作
      return { 
        success: true, 
        data: { 
          type: 'webhook-trigger',
          message: '此流程可由Webhook觸發',
          timestamp: new Date().toISOString()
        }
      };
    
    case 'line-push':
      const pushAccessTokenTemplate = node.data.headers?.Authorization?.replace('Bearer ', '');
      const pushUserId = node.data.body?.to;
      const pushMessageTemplate = node.data.body?.messages?.[0]?.text;
      
      // 檢查必要參數
      if (!pushAccessTokenTemplate) {
        return { success: false, error: 'LINE推送失敗: 缺少 Access Token' };
      }
      if (!pushUserId) {
        return { success: false, error: 'LINE推送失敗: 缺少用戶ID' };
      }
      
      // 處理 Token 替換
      let processedPushAccessToken = pushAccessTokenTemplate.replace(/\{([^}]+)\}/g, (match, key) => {
        if (context[key]) return context[key];
        if (tokens[key]) return tokens[key].token;
        return match;
      });
      
      // 處理其他變數替換
      let processedPushMessage = pushMessageTemplate || '';
      let processedUserId = pushUserId;
      
      processedPushMessage = processedPushMessage.replace(/\{([^}]+)\}/g, (match, key) => {
        return context[key] || context._lastResult?.data?.[key] || match;
      });
      processedUserId = processedUserId.replace(/\{([^}]+)\}/g, (match, key) => {
        return context[key] || context._lastResult?.data?.[key] || match;
      });
      
      try {
        const response = await axios.post(
          'https://api.line.me/v2/bot/message/push',
          {
            to: processedUserId,
            messages: [{
              type: 'text',
              text: processedPushMessage
            }]
          },
          {
            headers: {
              'Authorization': `Bearer ${processedPushAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`📱 LINE推送訊息成功: ${processedPushMessage}`);
        return { 
          success: true, 
          data: { 
            type: 'line-push',
            message: processedPushMessage,
            userId: processedUserId,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        return { success: false, error: `LINE推送失敗: ${error.message}` };
      }
    
    case 'line-reply':
      const lineAccessTokenTemplate = node.data.headers?.Authorization?.replace('Bearer ', '');
      const replyTokenTemplate = node.data.body?.replyToken;
      const messageTemplate = node.data.body?.messages?.[0]?.text;
      
      // 檢查必要參數
      if (!lineAccessTokenTemplate) {
        return { success: false, error: 'LINE回覆失敗: 缺少 Access Token' };
      }
      if (!replyTokenTemplate) {
        return { success: false, error: 'LINE回覆失敗: 缺少 Reply Token' };
      }
      
      // 處理 Token 替換
      let processedAccessToken = lineAccessTokenTemplate.replace(/\{([^}]+)\}/g, (match, key) => {
        if (context[key]) return context[key];
        if (tokens[key]) return tokens[key].token;
        return match;
      });
      
      // 處理其他變數替換
      let processedReplyToken = replyTokenTemplate.replace(/\{([^}]+)\}/g, (match, key) => {
        return context[key] || context._lastResult?.data?.[key] || match;
      });
      
      let processedMessage = messageTemplate || '';
      if (messageTemplate) {
        processedMessage = messageTemplate.replace(/\{([^}]+)\}/g, (match, key) => {
          return context[key] || context._lastResult?.data?.[key] || match;
        });
      }
      
      try {
        const response = await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          {
            replyToken: processedReplyToken,
            messages: [{
              type: 'text',
              text: processedMessage
            }]
          },
          {
            headers: {
              'Authorization': `Bearer ${processedAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`📱 LINE回覆訊息成功: ${processedMessage}`);
        return { 
          success: true, 
          data: { 
            type: 'line-reply',
            message: processedMessage,
            replyToken: processedReplyToken,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        console.log(`❌ LINE回覆API錯誤:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          accessToken: processedAccessToken ? `${processedAccessToken.substring(0, 10)}...` : 'undefined',
          replyToken: processedReplyToken
        });
        return { success: false, error: `LINE回覆失敗: ${error.response?.status} ${error.message}` };
      }
    
    default:
      return { success: false, error: '未知的節點類型' };
  }
}

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
    
    res.json({ success: true, results, finalContext: context });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 儲存工作流程
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
  
  // 儲存到檔案
  saveData(WORKFLOWS_FILE, workflows);
  saveData(METADATA_FILE, workflowMetadata);
  
  res.json({ workflowId, ...workflowMetadata[workflowId] });
});

// 更新工作流程
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
  
  // 儲存到檔案
  saveData(WORKFLOWS_FILE, workflows);
  saveData(METADATA_FILE, workflowMetadata);
  
  res.json({ success: true, ...workflowMetadata[workflowId] });
});

// 獲取所有工作流程列表
app.get('/api/workflows', (req, res) => {
  const workflowList = Object.values(workflowMetadata).sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
  res.json({ workflows: workflowList });
});

// 刪除工作流程
app.delete('/api/workflows/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  
  if (!workflows[workflowId]) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  
  delete workflows[workflowId];
  delete workflowMetadata[workflowId];
  
  // 儲存到檔案
  saveData(WORKFLOWS_FILE, workflows);
  saveData(METADATA_FILE, workflowMetadata);
  
  res.json({ success: true, message: '工作流程已刪除' });
});

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

// 獲取工作流程
app.get('/api/workflows/:workflowId', (req, res) => {
  const workflow = workflows[req.params.workflowId];
  if (!workflow) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  res.json(workflow);
});

// 測試API端點
app.get('/test/users/:id', (req, res) => {
  const userId = req.params.id;
  const users = {
    '1': { id: 1, name: 'Alice', email: 'alice@example.com', department: 'IT' },
    '2': { id: 2, name: 'Bob', email: 'bob@example.com', department: 'Sales' },
    '3': { id: 3, name: 'Charlie', email: 'charlie@example.com', department: 'HR' }
  };
  
  if (users[userId]) {
    res.json(users[userId]);
  } else {
    res.status(404).json({ error: '用戶不存在' });
  }
});

app.get('/test/orders/:userId', (req, res) => {
  const userId = req.params.userId;
  const orders = {
    '1': [{ id: 101, product: '筆記型電腦', amount: 50000 }, { id: 102, product: '滑鼠', amount: 800 }],
    '2': [{ id: 201, product: '手機', amount: 25000 }],
    '3': []
  };
  
  res.json({ userId: parseInt(userId), orders: orders[userId] || [] });
});

app.post('/test/notifications', (req, res) => {
  console.log('📧 發送通知:', req.body);
  res.json({ success: true, message: '通知已發送', timestamp: new Date().toISOString() });
});

// 模擬LINE webhook測試
app.post('/test/line-webhook/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const { message } = req.body;
  
  // 模擬LINE webhook資料
  const mockLineData = {
    events: [{
      type: 'message',
      message: {
        type: 'text',
        text: message || '你好'
      },
      source: {
        userId: 'U1234567890abcdef'
      },
      replyToken: 'mock-reply-token-12345',
      timestamp: Date.now()
    }]
  };
  
  console.log(`🧪 模擬LINE webhook測試: ${workflowId}`);
  
  // 轉發到實際的LINE webhook處理
  try {
    const response = await axios.post(
      `http://localhost:${PORT}/webhook/line/${workflowId}`,
      mockLineData
    );
    res.json({ success: true, message: '測試webhook已觸發', data: mockLineData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook接收端點
app.post('/webhook/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const webhookData = req.body;
  
  console.log(`🔗 收到Webhook: ${workflowId}`, webhookData);
  
  // 自動執行對應的工作流程
  const workflow = workflows[workflowId];
  if (workflow) {
    try {
      let context = { ...webhookData };
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
      
      console.log('🚀 Webhook觸發工作流程執行完成');
    } catch (error) {
      console.error('❌ Webhook執行失敗:', error);
    }
  }
  
  res.status(200).json({ message: 'webhook received' });
});

// LINE Webhook專用端點
app.post('/webhook/line/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const lineData = req.body;
  
  console.log(`📱 收到LINE Webhook: ${workflowId}`, JSON.stringify(lineData, null, 2));
  
  // 處理LINE事件
  if (lineData.events && lineData.events.length > 0) {
    for (const event of lineData.events) {
      console.log(`📝 處理LINE事件:`, event);
      
      const eventData = {
        type: event.type,
        userId: event.source?.userId,
        message: event.message?.text,
        replyToken: event.replyToken,
        timestamp: event.timestamp
      };
      
      console.log(`📋 提取的事件資料:`, eventData);
      
      // 執行對應工作流程
      const workflow = workflows[workflowId];
      if (workflow) {
        console.log(`🔄 開始執行工作流程: ${workflowId}`);
        console.log(`📝 工作流程節點順序:`, workflow.nodes.map(n => `${n.id}(${n.data.type})`));
        try {
          let context = { ...eventData };
          context._lastResult = { success: true, data: eventData };
          const results = [];
          
          // 先執行 webhook-trigger
          const triggerNode = workflow.nodes.find(n => n.data.type === 'webhook-trigger');
          if (triggerNode) {
            console.log(`🔧 執行節點: ${triggerNode.id} (${triggerNode.data.type})`);
            const result = await executeNode(triggerNode, context);
            results.push({ nodeId: triggerNode.id, result });
            context[triggerNode.id] = result.data;
            context._lastResult = result;
          }
          
          // 找到所有條件節點
          const conditionNodes = workflow.nodes.filter(n => n.data.type === 'condition');
          let conditionMatched = false;
          
          for (const conditionNode of conditionNodes) {
            console.log(`🔧 執行節點: ${conditionNode.id} (${conditionNode.data.type})`);
            const result = await executeNode(conditionNode, context);
            results.push({ nodeId: conditionNode.id, result });
            context[conditionNode.id] = result.data;
            context._lastResult = result;
            
            // 如果條件為 true，執行連接的節點
            if (result.data) {
              const connectedEdge = workflow.edges.find(edge => edge.source === conditionNode.id);
              if (connectedEdge) {
                const targetNode = workflow.nodes.find(n => n.id === connectedEdge.target);
                if (targetNode) {
                  console.log(`✅ 條件為 true，執行連接的節點: ${targetNode.id}`);
                  const targetResult = await executeNode(targetNode, context);
                  results.push({ nodeId: targetNode.id, result: targetResult });
                  
                  if (targetResult.success) {
                    context[targetNode.id] = targetResult.data;
                    context._lastResult = targetResult;
                  }
                  
                  conditionMatched = true;
                  break;
                }
              }
            }
          }
          
          // 如果所有條件都為 false，執行預設回覆
          if (!conditionMatched && triggerNode) {
            // 找到直接連接到 webhook-trigger 的非條件節點
            const defaultEdges = workflow.edges.filter(edge => 
              edge.source === triggerNode.id && 
              !workflow.nodes.find(n => n.id === edge.target && n.data.type === 'condition')
            );
            
            for (const edge of defaultEdges) {
              const defaultNode = workflow.nodes.find(n => n.id === edge.target);
              if (defaultNode) {
                console.log(`💬 所有條件都不符合，執行預設節點: ${defaultNode.id}`);
                const defaultResult = await executeNode(defaultNode, context);
                results.push({ nodeId: defaultNode.id, result: defaultResult });
                
                if (defaultResult.success) {
                  context[defaultNode.id] = defaultResult.data;
                  context._lastResult = defaultResult;
                }
                break;
              }
            }
          }
          
          console.log('🚀 LINE Webhook觸發工作流程執行完成', results);
        } catch (error) {
          console.error('❌ LINE Webhook執行失敗:', error);
        }
      } else {
        console.log(`⚠️ 找不到工作流程: ${workflowId}`);
      }
    }
  } else {
    console.log('⚠️ 沒有LINE事件資料');
  }
  
  res.status(200).json({ message: 'ok' });
});

// 調試端點
app.get('/debug/workflows', (req, res) => {
  const workflowList = Object.keys(workflows).map(id => ({
    id,
    nodeCount: workflows[id].nodes?.length || 0,
    nodes: workflows[id].nodes?.map(n => ({ id: n.id, type: n.data.type, label: n.data.label })) || []
  }));
  res.json({ workflows: workflowList });
});

app.get('/debug/workflow/:workflowId', (req, res) => {
  const workflow = workflows[req.params.workflowId];
  if (workflow) {
    res.json(workflow);
  } else {
    res.status(404).json({ error: '工作流程不存在' });
  }
});

app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
  console.log('測試API已啟用:');
  console.log('- GET /test/users/:id - 取得用戶資料');
  console.log('- GET /test/orders/:userId - 取得用戶訂單');
  console.log('- POST /test/notifications - 發送通知');
  console.log('- POST /test/line-webhook/:workflowId - 模擬LINE webhook');
  console.log('\n調試端點:');
  console.log('- GET /debug/workflows - 查看所有工作流程');
  console.log('- GET /debug/workflow/:workflowId - 查看特定工作流程');
  console.log('\nWebhook端點已啟用:');
  console.log('- POST /webhook/:workflowId - 一般Webhook接收');
  console.log('- POST /webhook/line/:workflowId - LINE Webhook接收');
});