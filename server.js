const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 儲存流程定義
let workflows = {};

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
      if (typeof requestData === 'object' && requestData !== null) {
        const replaceVariables = (obj) => {
          if (typeof obj === 'string') {
            return obj.replace(/\{([^}]+)\}/g, (match, key) => {
              return context[key] || match;
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
        requestData = replaceVariables(requestData);
      }
      
      console.log(`🌐 發送HTTP請求: ${method} ${processedUrl}`, requestData);
      
      try {
        const response = await axios({
          method: method || 'GET',
          url: processedUrl,
          headers: headers || {},
          data: requestData
        });
        console.log(`✅ HTTP請求成功: ${response.status}`);
        return { success: true, data: response.data };
      } catch (error) {
        console.log(`❌ HTTP請求失敗: ${error.message}`);
        return { success: false, error: error.message };
      }
    
    case 'condition':
      const { condition } = node.data;
      // 支援 $prev 引用前一個節點結果
      const processedCondition = condition
        .replace(/\$prev/g, 'context._lastResult')
        .replace(/\$\{(\w+)\}/g, (match, key) => {
          return JSON.stringify(context[key]);
        });
      const result = eval(processedCondition);
      return { success: true, data: result };
    
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
      const { accessToken, userId, message: lineMessage } = node.data;
      
      // 處理訊息中的變數替換
      let processedMessage = lineMessage;
      if (context._lastResult && context._lastResult.data) {
        processedMessage = lineMessage.replace(/\{([^}]+)\}/g, (match, key) => {
          return context._lastResult.data[key] || match;
        });
      }
      
      try {
        const response = await axios.post(
          'https://api.line.me/v2/bot/message/push',
          {
            to: userId,
            messages: [{
              type: 'text',
              text: processedMessage
            }]
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`📱 LINE推送訊息成功: ${processedMessage}`);
        return { 
          success: true, 
          data: { 
            type: 'line-push',
            message: processedMessage,
            userId,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        return { success: false, error: `LINE推送失敗: ${error.message}` };
      }
    
    case 'line-reply':
      const { accessToken: replyToken, replyTokenValue, message: replyMessage } = node.data;
      
      // 處理訊息中的變數替換
      let processedReplyMessage = replyMessage;
      if (context._lastResult && context._lastResult.data) {
        processedReplyMessage = replyMessage.replace(/\{([^}]+)\}/g, (match, key) => {
          return context._lastResult.data[key] || match;
        });
      }
      
      try {
        const response = await axios.post(
          'https://api.line.me/v2/bot/message/reply',
          {
            replyToken: replyTokenValue,
            messages: [{
              type: 'text',
              text: processedReplyMessage
            }]
          },
          {
            headers: {
              'Authorization': `Bearer ${replyToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`📱 LINE回覆訊息成功: ${processedReplyMessage}`);
        return { 
          success: true, 
          data: { 
            type: 'line-reply',
            message: processedReplyMessage,
            replyToken: replyTokenValue,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        return { success: false, error: `LINE回覆失敗: ${error.message}` };
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
  workflows[workflowId] = req.body;
  res.json({ workflowId });
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
        try {
          let context = { ...eventData };
          context._lastResult = { success: true, data: eventData };
          const results = [];
          
          for (const node of workflow.nodes) {
            console.log(`🔧 執行節點: ${node.id} (${node.data.type})`);
            const result = await executeNode(node, context);
            results.push({ nodeId: node.id, result });
            
            if (result.success) {
              context[node.id] = result.data;
              context._lastResult = result;
            } else {
              context._lastResult = result;
              console.log(`❌ 節點執行失敗: ${node.id}`, result.error);
              break;
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