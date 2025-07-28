const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 執行狀態管理
class ExecutionState {
  constructor(workflowId, inputData) {
    this.sessionId = uuidv4();
    this.workflowId = workflowId;
    this.status = 'ready'; // ready, running, paused, stopped, completed
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
  origin: [
    'http://localhost:3000',
    'https://alan-ddddd.github.io',
    'https://ui-coral-eta-48.vercel.app'
  ],
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

// 資料檔案路徑
const DATA_DIR = path.join(__dirname, 'data');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

console.log('📁 資料目錄:', DATA_DIR);
console.log('📄 檔案存在:', {
  workflows: fs.existsSync(WORKFLOWS_FILE),
  metadata: fs.existsSync(METADATA_FILE),
  tokens: fs.existsSync(TOKENS_FILE)
});

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
        return { 
          success: true, 
          data: result,
          branch: result ? 'true' : 'false' // 添加分支信息
        };
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
    
    case 'if-condition':
      const { conditions, logic } = node.data;
      
      if (!conditions || conditions.length === 0) {
        return { success: false, error: 'IF條件設定不完整' };
      }
      
      console.log(`🔀 IF條件判斷開始，邏輯: ${logic || 'AND'}`);
      console.log(`📝 Context 資料:`, JSON.stringify(context, null, 2));
      
      const results = [];
      
      // 評估每個條件
      for (let i = 0; i < conditions.length; i++) {
        const cond = conditions[i];
        let fieldValue;
        
        // 取得欄位值
        if (cond.field && cond.field.startsWith('{') && cond.field.endsWith('}')) {
          const key = cond.field.slice(1, -1);
          fieldValue = context[key] || context._lastResult?.data?.[key];
        } else {
          fieldValue = cond.field;
        }
        
        // 執行單個條件判斷
        let conditionResult = false;
        switch (cond.operator) {
          case '>':
            conditionResult = Number(fieldValue) > Number(cond.value);
            break;
          case '<':
            conditionResult = Number(fieldValue) < Number(cond.value);
            break;
          case '>=':
            conditionResult = Number(fieldValue) >= Number(cond.value);
            break;
          case '<=':
            conditionResult = Number(fieldValue) <= Number(cond.value);
            break;
          case '==':
          case '等於':
            conditionResult = String(fieldValue) === String(cond.value);
            break;
          case '!=':
          case '不等於':
            conditionResult = String(fieldValue) !== String(cond.value);
            break;
          case 'contains':
          case '包含':
            conditionResult = String(fieldValue).includes(String(cond.value));
            break;
          case 'not_contains':
          case '不包含':
            conditionResult = !String(fieldValue).includes(String(cond.value));
            break;
          default:
            conditionResult = false;
        }
        
        results.push(conditionResult);
        console.log(`🔍 條件 ${i + 1}: ${fieldValue} ${cond.operator} ${cond.value} = ${conditionResult}`);
      }
      
      // 根據邏輯運算符計算最終結果
      let finalResult;
      if (logic === 'OR') {
        finalResult = results.some(r => r === true);
      } else { // 預設為 AND
        finalResult = results.every(r => r === true);
      }
      
      console.log(`🔀 IF條件最終結果 (${logic}): ${finalResult}`);
      
      return { 
        success: true, 
        data: finalResult,
        branch: finalResult ? 'true' : 'false', // 添加分支信息
        details: {
          conditions: conditions.map((cond, i) => ({
            condition: `${cond.field} ${cond.operator} ${cond.value}`,
            result: results[i]
          })),
          logic,
          finalResult
        }
      };
    
    case 'switch':
      const { switchField, cases, defaultCase } = node.data;
      
      if (!switchField) {
        return { success: false, error: 'Switch欄位設定不完整' };
      }
      
      console.log(`🔀 Switch判斷開始`);
      console.log(`📝 Context 資料:`, JSON.stringify(context, null, 2));
      
      // 取得欄位值
      let switchValue;
      if (switchField.startsWith('{') && switchField.endsWith('}')) {
        const key = switchField.slice(1, -1);
        switchValue = context[key] || context._lastResult?.data?.[key];
      } else {
        switchValue = switchField;
      }
      
      console.log(`🔍 Switch值: ${switchValue}`);
      
      // 尋找匹配的case
      let matchedCase = null;
      if (cases && cases.length > 0) {
        matchedCase = cases.find(c => String(c.value) === String(switchValue));
        console.log(`🔍 可用Cases: ${cases.map(c => c.value).join(', ')}`);
      }
      
      const branch = matchedCase ? String(matchedCase.value) : 'default';
      console.log(`🔀 Switch匹配分支: ${branch} (匹配到: ${matchedCase ? 'Yes' : 'No'})`);
      
      return {
        success: true,
        data: switchValue,
        branch: String(branch),
        details: {
          switchValue,
          matchedCase: matchedCase?.value || 'default',
          availableCases: cases?.map(c => c.value) || []
        }
      };
    
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
    
    case 'workflow-reference':
    case 'existing-workflow':
      // 執行引用的工作流程
      const { workflowId: refWorkflowId } = node.data;
      const referencedWorkflow = workflows[refWorkflowId];
      
      if (!referencedWorkflow) {
        return { success: false, error: `引用的工作流程 ${refWorkflowId} 不存在` };
      }
      
      // 檢查循環引用（運行時檢查）
      if (!context._executionStack) {
        context._executionStack = new Set();
      }
      
      if (context._executionStack.has(refWorkflowId)) {
        return { success: false, error: `檢測到循環引用：流程 ${refWorkflowId} 正在執行中` };
      }
      
      context._executionStack.add(refWorkflowId);
      
      console.log(`🔗 執行引用的工作流程: ${node.data.workflowName || node.data.label} (${refWorkflowId})`);
      
      try {
        // 創建子流程上下文
        let subContext = { ...context };
        
        // 處理參數映射和傳遞
        if (node.data.paramMappings && node.data.paramMappings.length > 0) {
          console.log(`🔗 處理參數映射:`, node.data.paramMappings);
          
          // 清空子上下文，只保留系統變數
          const systemVars = ['_lastResult', '_executionStack', '_usedReplyTokens', 'userId', 'replyToken', 'message', 'type', 'timestamp'];
          const cleanSubContext = {};
          systemVars.forEach(key => {
            if (context[key] !== undefined) {
              cleanSubContext[key] = context[key];
            }
          });
          subContext = cleanSubContext;
          
          // 執行參數映射
          for (const mapping of node.data.paramMappings) {
            if (mapping.sourceParam && mapping.targetParam) {
              let sourceValue = mapping.sourceParam;
              
              // 處理變數替換 {variableName}
              sourceValue = sourceValue.replace(/\{([^}]+)\}/g, (match, key) => {
                // 優先從當前上下文取值
                if (context[key] !== undefined) return context[key];
                // 從上一步結果取值
                if (context._lastResult?.data?.[key] !== undefined) return context._lastResult.data[key];
                // 從tokens取值
                if (tokens[key]) return tokens[key].token;
                return match;
              });
              
              // 設定目標參數
              subContext[mapping.targetParam] = sourceValue;
              console.log(`🔗 映射: ${mapping.sourceParam} → ${mapping.targetParam} = ${sourceValue}`);
            }
          }
        } else {
          // 如果沒有參數映射，傳遞所有當前上下文
          console.log(`🔗 沒有參數映射，傳遞完整上下文`);
        }
        const subResults = [];
        
        // 為子流程設定初始結果
        if (!subContext._lastResult) {
          subContext._lastResult = { success: true, data: subContext };
        }
        
        // 過濾出啟用的邊
        const activeEdges = (referencedWorkflow.edges || []).filter(edge => edge.data?.active !== false);
        
        // 使用與LINE Webhook相同的執行邏輯來處理子流程
        const triggerNodes = referencedWorkflow.nodes.filter(n => n.data.type === 'webhook-trigger');
        
        if (triggerNodes.length > 0) {
          // 有webhook-trigger節點，使用條件分支邏輯
          for (const triggerNode of triggerNodes) {
            console.log(`🔧 子流程執行起點: ${triggerNode.id}`);
            const result = await executeNode(triggerNode, subContext);
            subResults.push({ nodeId: triggerNode.id, result });
            subContext[triggerNode.id] = result.data;
            subContext._lastResult = result;
            
            // 找到這個 trigger 連接的條件節點
            const connectedConditionEdges = activeEdges.filter(edge => 
              edge.source === triggerNode.id && 
              referencedWorkflow.nodes.find(n => n.id === edge.target && n.data.type === 'condition')
            );
            
            let conditionMatched = false;
            
            // 執行條件節點
            for (const edge of connectedConditionEdges) {
              const conditionNode = referencedWorkflow.nodes.find(n => n.id === edge.target);
              if (conditionNode) {
                const conditionResult = await executeNode(conditionNode, subContext);
                subResults.push({ nodeId: conditionNode.id, result: conditionResult });
                subContext[conditionNode.id] = conditionResult.data;
                subContext._lastResult = conditionResult;
                
                // 如果條件為 true，執行連接的節點
                if (conditionResult.data) {
                  const actionEdges = activeEdges.filter(e => e.source === conditionNode.id);
                  for (const actionEdge of actionEdges) {
                    const actionNode = referencedWorkflow.nodes.find(n => n.id === actionEdge.target);
                    if (actionNode) {
                      console.log(`✅ 子流程條件為 true，執行: ${actionNode.id}`);
                      const actionResult = await executeNode(actionNode, subContext);
                      subResults.push({ nodeId: actionNode.id, result: actionResult });
                      
                      if (actionResult.success) {
                        subContext[actionNode.id] = actionResult.data;
                        subContext._lastResult = actionResult;
                      }
                    }
                  }
                  conditionMatched = true;
                }
              }
            }
            
            // 如果沒有條件匹配，執行預設節點
            if (!conditionMatched) {
              const defaultEdges = activeEdges.filter(edge => 
                edge.source === triggerNode.id && 
                !referencedWorkflow.nodes.find(n => n.id === edge.target && n.data.type === 'condition')
              );
              
              for (const edge of defaultEdges) {
                const defaultNode = referencedWorkflow.nodes.find(n => n.id === edge.target);
                if (defaultNode) {
                  console.log(`💬 子流程執行預設節點: ${defaultNode.id}`);
                  const defaultResult = await executeNode(defaultNode, subContext);
                  subResults.push({ nodeId: defaultNode.id, result: defaultResult });
                  
                  if (defaultResult.success) {
                    subContext[defaultNode.id] = defaultResult.data;
                    subContext._lastResult = defaultResult;
                  }
                  break;
                }
              }
            }
          }
        } else {
          // 沒有webhook-trigger，順序執行所有節點
          for (const subNode of referencedWorkflow.nodes) {
            const hasActiveConnection = activeEdges.some(edge => edge.target === subNode.id) || 
                                       referencedWorkflow.nodes.indexOf(subNode) === 0;
            
            if (!hasActiveConnection && referencedWorkflow.nodes.indexOf(subNode) !== 0) {
              console.log(`⏸️ 跳過子流程節點 ${subNode.id}，因為沒有啟用的連接`);
              continue;
            }
            
            const subResult = await executeNode(subNode, subContext);
            subResults.push({ nodeId: subNode.id, result: subResult });
            
            if (subResult.success) {
              subContext[subNode.id] = subResult.data;
              subContext._lastResult = subResult;
            } else {
              subContext._lastResult = subResult;
              break;
            }
          }
        }
        
        console.log(`✅ 引用流程執行完成: ${node.data.workflowName}`);
        
        // 移除執行棧記錄
        context._executionStack.delete(refWorkflowId);
        
        // 處理返回值映射
        let returnData = subContext._lastResult?.data || {};
        
        // 如果目標流程定義了輸出參數，只返回指定的參數
        if (referencedWorkflow.outputParams && referencedWorkflow.outputParams.length > 0) {
          const filteredData = {};
          referencedWorkflow.outputParams.forEach(param => {
            if (returnData[param.name] !== undefined) {
              filteredData[param.name] = returnData[param.name];
            }
          });
          returnData = filteredData;
          console.log(`🔗 根據輸出參數過濾返回值:`, returnData);
        }
        
        return { 
          success: true, 
          data: {
            type: 'workflow-reference',
            workflowId: refWorkflowId,
            workflowName: node.data.workflowName,
            results: subResults,
            finalResult: subContext._lastResult,
            returnData: returnData,
            executedNodes: subResults.length,
            timestamp: new Date().toISOString(),
            ...returnData
          }
        };
      } catch (error) {
        console.log(`❌ 引用流程執行失敗: ${node.data.workflowName}`, {
          error: error.message,
          stack: error.stack,
          workflowId: refWorkflowId,
          paramMappings: node.data.paramMappings,
          subContext: Object.keys(subContext)
        });
        // 移除執行棧記錄
        context._executionStack.delete(refWorkflowId);
        return { 
          success: false, 
          error: `引用流程執行失敗: ${error.message}`,
          details: {
            workflowId: refWorkflowId,
            workflowName: node.data.workflowName,
            paramMappings: node.data.paramMappings,
            availableContext: Object.keys(context)
          }
        };
      }
    
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
    
    case 'line-carousel':
      const carouselAccessTokenTemplate = node.data.headers?.Authorization?.replace('Bearer ', '');
      const carouselReplyToken = node.data.body?.replyToken;
      const carouselUserId = node.data.body?.to;
      const carouselData = node.data.body?.messages?.[0]?.template;
      
      if (!carouselAccessTokenTemplate) {
        return { success: false, error: 'LINE Carousel失敗: 缺少 Access Token' };
      }
      
      // 處理 Token 替換
      let processedCarouselToken = carouselAccessTokenTemplate.replace(/\{([^}]+)\}/g, (match, key) => {
        if (context[key]) return context[key];
        if (tokens[key]) return tokens[key].token;
        return match;
      });
      
      // 檢查 template 資料
      if (!carouselData || typeof carouselData !== 'object') {
        return { success: false, error: 'LINE Carousel失敗: 缺少或無效的 template 資料' };
      }
      
      // 修復 carousel template 格式
      const fixCarouselTemplate = (template) => {
        if (template.columns && Array.isArray(template.columns)) {
          template.columns.forEach(column => {
            // 確保每個 column 都有必要的欄位
            if (!column.title) column.title = '標題';
            if (!column.text) column.text = '內容';
            
            if (column.actions && Array.isArray(column.actions)) {
              column.actions.forEach(action => {
                // URI action 不應該有 text 欄位
                if (action.type === 'uri' && action.text !== undefined) {
                  delete action.text;
                }
                // 確保 label 存在
                if (!action.label) {
                  action.label = action.type === 'uri' ? '連結' : '選項';
                }
              });
            } else {
              // 如果沒有 actions，添加一個預設的
              column.actions = [{
                type: 'message',
                label: '確定',
                text: '確定'
              }];
            }
          });
          
          // 確保所有 columns 的 actions 數量一致
          let maxActions = Math.max(...template.columns.map(col => col.actions.length));
          template.columns.forEach(column => {
            while (column.actions.length < maxActions) {
              column.actions.push({
                type: 'message',
                label: '更多',
                text: '更多'
              });
            }
          });
        }
        return template;
      };
      
      const fixedCarouselData = fixCarouselTemplate({ ...carouselData });
      
      // 處理 replyToken 替換
      let carouselProcessedReplyToken = '';
      if (carouselReplyToken) {
        carouselProcessedReplyToken = carouselReplyToken.replace(/\{([^}]+)\}/g, (match, key) => {
          return context[key] || context._lastResult?.data?.[key] || match;
        });
      }
      
      // 檢查 replyToken 是否已被使用
      if (!context._usedReplyTokens) {
        context._usedReplyTokens = {};
      }
      const isReplyTokenUsed = carouselProcessedReplyToken && context._usedReplyTokens[carouselProcessedReplyToken];
      
      // 決定使用 reply 還是 push
      const shouldUseReply = !!carouselReplyToken && !isReplyTokenUsed;
      const apiUrl = shouldUseReply ? 
        'https://api.line.me/v2/bot/message/reply' : 
        'https://api.line.me/v2/bot/message/push';
      
      if (isReplyTokenUsed) {
        console.log(`⚠️ Carousel ReplyToken 已被使用，改為 Push 模式: ${carouselProcessedReplyToken}`);
      }
      
      let requestBody;
      if (shouldUseReply) {
        requestBody = {
          replyToken: carouselProcessedReplyToken,
          messages: [{
            type: 'template',
            altText: fixedCarouselData.altText || '多頁訊息',
            template: fixedCarouselData
          }]
        };
      } else {
        // 使用 Push 模式
        let userId = carouselUserId || context.userId;
        if (!userId) {
          return { success: false, error: 'LINE Carousel失敗: 無法取得用戶ID' };
        }
        
        let processedUserId = userId.replace ? userId.replace(/\{([^}]+)\}/g, (match, key) => {
          return context[key] || context._lastResult?.data?.[key] || match;
        }) : userId;
        
        requestBody = {
          to: processedUserId,
          messages: [{
            type: 'template',
            altText: fixedCarouselData.altText || '多頁訊息',
            template: fixedCarouselData
          }]
        };
      }
      
      console.log(`📱 準備發送 LINE Carousel:`, JSON.stringify(requestBody, null, 2));
      
      // 驗證 carousel 格式
      const validateCarousel = (template) => {
        if (!template.columns || !Array.isArray(template.columns)) {
          return '缺少 columns 陣列';
        }
        if (template.columns.length === 0) {
          return 'columns 陣列不能為空';
        }
        for (let i = 0; i < template.columns.length; i++) {
          const col = template.columns[i];
          if (!col.title || !col.text) {
            return `第 ${i+1} 個 column 缺少 title 或 text`;
          }
          if (!col.actions || !Array.isArray(col.actions) || col.actions.length === 0) {
            return `第 ${i+1} 個 column 缺少 actions`;
          }
        }
        return null;
      };
      
      const validationError = validateCarousel(requestBody.messages[0].template);
      if (validationError) {
        console.log(`❌ Carousel 格式驗證失敗: ${validationError}`);
        return { success: false, error: `LINE Carousel格式錯誤: ${validationError}` };
      }
      
      try {
        const response = await axios.post(apiUrl, requestBody, {
          headers: {
            'Authorization': `Bearer ${processedCarouselToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // 標記 replyToken 為已使用（如果使用了 reply 模式）
        if (shouldUseReply && carouselProcessedReplyToken) {
          context._usedReplyTokens[carouselProcessedReplyToken] = true;
        }
        
        console.log(`📱 LINE Carousel訊息成功（${shouldUseReply ? 'Reply' : 'Push'} 模式）`);
        return { 
          success: true, 
          data: { 
            type: 'line-carousel',
            mode: shouldUseReply ? 'reply' : 'push',
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        console.log(`❌ LINE Carousel API錯誤:`, {
          status: error.response?.status,
          data: error.response?.data,
          details: error.response?.data?.details,
          accessToken: processedCarouselToken ? `${processedCarouselToken.substring(0, 10)}...` : 'undefined',
          requestBody: JSON.stringify(requestBody, null, 2)
        });
        return { success: false, error: `LINE Carousel失敗: ${error.response?.status} ${error.message}` };
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
      
      // 檢查 replyToken 是否已被使用
      if (!context._usedReplyTokens) {
        context._usedReplyTokens = {};
      }
      const isReplyTokenUsedInReply = context._usedReplyTokens[processedReplyToken];
      
      if (isReplyTokenUsedInReply) {
        console.log(`⚠️ ReplyToken 已被使用，改為 Push 模式: ${processedReplyToken}`);
        // 改為 Push 模式
        const userId = context.userId;
        if (!userId) {
          return { success: false, error: 'LINE推送失敗: 無法取得用戶ID' };
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
                'Authorization': `Bearer ${processedAccessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`📱 LINE推送訊息成功（Push模式）: ${processedMessage}`);
          return { 
            success: true, 
            data: { 
              type: 'line-push',
              mode: 'push',
              message: processedMessage,
              userId,
              timestamp: new Date().toISOString()
            }
          };
        } catch (error) {
          console.log(`❌ LINE推送API錯誤:`, {
            status: error.response?.status,
            data: error.response?.data,
            accessToken: processedAccessToken ? `${processedAccessToken.substring(0, 10)}...` : 'undefined',
            userId
          });
          return { success: false, error: `LINE推送失敗: ${error.response?.status} ${error.message}` };
        }
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
        
        // 標記 replyToken 為已使用
        context._usedReplyTokens[processedReplyToken] = true;
        
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
    // 檢查是否為組合流程
    if (workflow.isComposed) {
      console.log(`🔗 執行組合流程: ${workflowId}`);
      
      // 按順序執行每個引用的流程節點
      for (const node of workflow.nodes) {
        if (node.data.type === 'workflow-reference') {
          console.log(`📋 執行引用流程: ${node.data.workflowName}`);
          const result = await executeNode(node, context);
          results.push({ nodeId: node.id, result });
          
          if (result.success) {
            context[node.id] = result.data;
            context._lastResult = result;
            // 將子流程的最終結果作為下一個流程的輸入
            if (result.data.finalResult) {
              context._lastResult = result.data.finalResult;
            }
          } else {
            context._lastResult = result;
            break;
          }
        }
      }
    } else {
      // 一般流程執行邏輯 - 支援條件分支
      const activeEdges = workflow.edges.filter(edge => edge.data?.active !== false);
      
      // 使用圖遍歷而非線性執行
      const executedNodes = new Set();
      const executeFromNode = async (startNodeId) => {
        if (executedNodes.has(startNodeId)) return;
        
        const node = workflow.nodes.find(n => n.id === startNodeId);
        if (!node) return;
        
        executedNodes.add(startNodeId);
        const result = await executeNode(node, context);
        results.push({ nodeId: node.id, result });
        
        if (result.success) {
          context[node.id] = result.data;
          context._lastResult = result;
          
          // 處理條件分支和Switch分支
          if ((node.data.type === 'condition' || node.data.type === 'if-condition' || node.data.type === 'switch') && result.branch) {
            console.log(`🔀 條件節點 ${node.id} 結果: ${result.branch}`);
            
            // 找到對應分支的邊
            const branchEdges = activeEdges.filter(edge => {
              if (edge.source !== node.id) return false;
              
              if (node.data.type === 'switch') {
                return edge.data?.branch === result.branch;
              } else {
                return edge.data?.branch === result.branch || 
                       (!edge.data?.branch && result.branch === 'true');
              }
            });
            
            console.log(`🔀 找到 ${branchEdges.length} 條 ${result.branch} 分支`);
            console.log(`🔍 所有邊:`, activeEdges.filter(e => e.source === node.id).map(e => `${e.target}(${e.data?.branch || 'no-branch'})`));
            
            // 執行對應分支的節點
            for (const edge of branchEdges) {
              console.log(`▶️ 執行分支節點: ${edge.target}`);
              await executeFromNode(edge.target);
            }
          } else {
            // 非條件節點，執行所有連接的節點
            const nextEdges = activeEdges.filter(edge => edge.source === node.id);
            for (const edge of nextEdges) {
              await executeFromNode(edge.target);
            }
          }
        } else {
          context._lastResult = result;
          console.log(`❌ 節點 ${node.id} 執行失敗: ${result.error}`);
        }
      };
      
      // 找到起始節點（沒有輸入邊的節點）
      const startNodes = workflow.nodes.filter(node => 
        !activeEdges.some(edge => edge.target === node.id)
      );
      
      console.log(`🚀 找到 ${startNodes.length} 個起始節點`);
      
      // 從每個起始節點開始執行
      for (const startNode of startNodes) {
        await executeFromNode(startNode.id);
      }
    }
    
    // 檢查是否有任何節點失敗
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

// 儲存工作流程
app.post('/api/workflows', (req, res) => {
  const workflowId = uuidv4();
  const { name, description, inputParams, outputParams, ...workflowData } = req.body;
  
  // 檢查新流程是否包含循環引用
  if (workflowData.nodes) {
    for (const node of workflowData.nodes) {
      if ((node.data.type === 'workflow-reference' || node.data.type === 'existing-workflow') && node.data.workflowId) {
        if (checkCircularReference(node.data.workflowId, [workflowId])) {
          return res.status(400).json({ 
            error: `檢測到循環引用：節點引用的流程 ${workflowMetadata[node.data.workflowId]?.name || node.data.workflowId} 會導致無窮迴圈` 
          });
        }
      }
    }
  }
  
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
  
  // 儲存到檔案
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
  
  // 檢查更新後的流程是否包含循環引用
  if (workflowData.nodes) {
    for (const node of workflowData.nodes) {
      if ((node.data.type === 'workflow-reference' || node.data.type === 'existing-workflow') && node.data.workflowId) {
        // 檢查是否引用自己
        if (node.data.workflowId === workflowId) {
          return res.status(400).json({ 
            error: `檢測到自我引用：流程不能引用自己` 
          });
        }
        // 檢查是否形成循環
        if (checkCircularReference(node.data.workflowId, [workflowId])) {
          return res.status(400).json({ 
            error: `檢測到循環引用：節點引用的流程 ${workflowMetadata[node.data.workflowId]?.name || node.data.workflowId} 會導致無窮迴圈` 
          });
        }
      }
    }
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

// 驗證參數映射
app.post('/api/workflows/:workflowId/validate-params', (req, res) => {
  const { workflowId } = req.params;
  const { paramMappings, sourceContext } = req.body;
  
  const workflow = workflows[workflowId];
  if (!workflow) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
    mappedParams: {},
    missingRequired: []
  };
  
  // 檢查必要參數
  if (workflow.inputParams) {
    workflow.inputParams.forEach(param => {
      const mapping = paramMappings.find(m => m.targetParam === param.name);
      
      if (param.required && (!mapping || !mapping.sourceParam)) {
        validation.missingRequired.push(param.name);
        validation.errors.push(`必要參數 '${param.name}' 未映射`);
        validation.valid = false;
      } else if (mapping && mapping.sourceParam) {
        // 模擬變數替換
        let resolvedValue = mapping.sourceParam;
        const unresolvedVars = [];
        
        resolvedValue = resolvedValue.replace(/\{([^}]+)\}/g, (match, key) => {
          if (sourceContext && sourceContext[key] !== undefined) {
            return sourceContext[key];
          }
          unresolvedVars.push(key);
          return match;
        });
        
        validation.mappedParams[param.name] = {
          source: mapping.sourceParam,
          resolved: resolvedValue,
          unresolvedVars
        };
        
        if (unresolvedVars.length > 0) {
          validation.warnings.push(`參數 '${param.name}' 中的變數 [${unresolvedVars.join(', ')}] 無法解析`);
        }
      }
    });
  }
  
  res.json(validation);
});

// 檢查循環引用的遞歸函數
function checkCircularReference(workflowId, targetWorkflowIds, visited = new Set()) {
  if (visited.has(workflowId)) {
    return true; // 發現循環
  }
  
  visited.add(workflowId);
  
  const workflow = workflows[workflowId];
  if (!workflow) return false;
  
  // 檢查是否直接引用目標流程
  if (workflow.referencedWorkflows) {
    for (const refId of workflow.referencedWorkflows) {
      if (targetWorkflowIds.includes(refId)) {
        return true; // 直接循環
      }
      // 遞歸檢查子流程
      if (checkCircularReference(refId, targetWorkflowIds, new Set(visited))) {
        return true;
      }
    }
  }
  
  // 檢查existing-workflow節點
  if (workflow.nodes) {
    for (const node of workflow.nodes) {
      if ((node.data.type === 'workflow-reference' || node.data.type === 'existing-workflow') && node.data.workflowId) {
        if (targetWorkflowIds.includes(node.data.workflowId)) {
          return true; // 直接循環
        }
        // 遞歸檢查
        if (checkCircularReference(node.data.workflowId, targetWorkflowIds, new Set(visited))) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 組合多個工作流程（使用引用方式）
app.post('/api/workflows/combine', (req, res) => {
  const { name, workflowIds } = req.body;
  
  if (!name || !workflowIds || workflowIds.length < 2) {
    return res.status(400).json({ error: '需要提供名稱和至少2個工作流程ID' });
  }
  
  try {
    // 檢查循環引用
    for (const workflowId of workflowIds) {
      if (checkCircularReference(workflowId, workflowIds)) {
        return res.status(400).json({ 
          error: `檢測到循環引用：流程 ${workflowMetadata[workflowId]?.name || workflowId} 會導致無窮迴圈` 
        });
      }
    }
    const combinedNodes = [];
    const combinedEdges = [];
    
    // 為每個選中的工作流程創建一個引用節點
    workflowIds.forEach((workflowId, index) => {
      const workflow = workflows[workflowId];
      const metadata = workflowMetadata[workflowId];
      
      if (!workflow || !metadata) {
        throw new Error(`工作流程 ${workflowId} 不存在`);
      }
      
      // 創建流程引用節點
      const refNodeId = `workflow-ref-${workflowId}`;
      combinedNodes.push({
        id: refNodeId,
        type: 'default',
        position: {
          x: 100 + (index * 300), // 水平排列
          y: 150
        },
        data: {
          type: 'workflow-reference',
          label: `📋 ${metadata.name}`,
          workflowId: workflowId,
          workflowName: metadata.name,
          nodeCount: metadata.nodeCount
        },
        className: 'node-workflow-reference',
        sourcePosition: 'right',
        targetPosition: 'left'
      });
      
      // 如果不是第一個節點，創建連接邊
      if (index > 0) {
        const prevNodeId = `workflow-ref-${workflowIds[index - 1]}`;
        combinedEdges.push({
          id: `edge-${prevNodeId}-${refNodeId}`,
          source: prevNodeId,
          target: refNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#4CAF50', strokeWidth: 3 },
          data: { active: true }
        });
      }
    });
    
    // 創建新的組合工作流程
    const workflowId = Date.now().toString();
    const combinedWorkflow = {
      nodes: combinedNodes,
      edges: combinedEdges,
      nodeGroups: {},
      isComposed: true, // 標記為組合流程
      referencedWorkflows: workflowIds // 記錄引用的流程ID
    };
    
    const combinedMetadata = {
      id: workflowId,
      name,
      description: `組合自 ${workflowIds.length} 個流程: ${workflowIds.map(id => workflowMetadata[id]?.name || id).join(', ')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: combinedNodes.length,
      isComposed: true,
      referencedWorkflows: workflowIds
    };
    
    workflows[workflowId] = combinedWorkflow;
    workflowMetadata[workflowId] = combinedMetadata;
    
    console.log(`🔧 創建組合流程 ${workflowId}:`, {
      isComposed: combinedWorkflow.isComposed,
      referencedWorkflows: combinedWorkflow.referencedWorkflows,
      nodeCount: combinedNodes.length
    });
    saveData(WORKFLOWS_FILE, workflows);
    saveData(METADATA_FILE, workflowMetadata);
    
    res.json({ 
      success: true, 
      message: '流程組合成功', 
      workflowId,
      nodeCount: combinedNodes.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
          // 初始化 replyToken 追蹤
          if (!context._usedReplyTokens) {
            context._usedReplyTokens = {};
          }
          
          // 檢查是否為組合流程
          console.log(`🔍 檢查流程類型 - isComposed: ${workflow.isComposed}, referencedWorkflows: ${JSON.stringify(workflow.referencedWorkflows)}`);
          
          // 臨時修復：檢查是否為組合流程（根據節點類型判斷）
          const isComposedWorkflow = workflow.isComposed || workflow.nodes.some(n => n.data.type === 'workflow-reference');
          console.log(`🔍 重新檢查 - 是否為組合流程: ${isComposedWorkflow}`);
          
          if (isComposedWorkflow) {
            console.log(`🔗 執行組合流程: ${workflowId}`);
            
            // 檢查組合流程中的子流程是否有webhook-trigger
            let hasWebhookTrigger = false;
            console.log(`🔍 檢查引用的流程:`, workflow.referencedWorkflows);
            
            for (const refWorkflowId of workflow.referencedWorkflows || []) {
              const refWorkflow = workflows[refWorkflowId];
              console.log(`🔍 檢查流程 ${refWorkflowId}:`, refWorkflow ? '存在' : '不存在');
              
              if (refWorkflow) {
                const triggerNodes = refWorkflow.nodes.filter(n => n.data.type === 'webhook-trigger');
                console.log(`🔍 流程 ${refWorkflowId} 的webhook-trigger節點:`, triggerNodes.length);
                
                if (triggerNodes.length > 0) {
                  hasWebhookTrigger = true;
                  console.log(`✅ 找到webhook-trigger節點在流程 ${refWorkflowId}`);
                  break;
                }
              }
            }
            
            console.log(`🔍 組合流程是否有webhook-trigger: ${hasWebhookTrigger}`);
            
            // 無論是否有webhook-trigger，都執行組合流程（因為LINE Webhook已經觸發）
            console.log(`🚀 開始執行組合流程的所有引用節點`);
            console.log(`📋 組合流程節點數量: ${workflow.nodes.length}`);
            
            for (const node of workflow.nodes) {
              if (node.data.type === 'workflow-reference') {
                console.log(`📋 執行引用流程: ${node.data.workflowName}`);
                const result = await executeNode(node, context);
                results.push({ nodeId: node.id, result });
                
                if (result.success) {
                  context[node.id] = result.data;
                  context._lastResult = result;
                  // 將子流程的最終結果作為下一個流程的輸入
                  if (result.data.finalResult) {
                    context._lastResult = result.data.finalResult;
                  }
                } else {
                  context._lastResult = result;
                  break;
                }
              }
            }
          } else {
            console.log(`🔗 執行一般流程: ${workflowId}`);
            // 一般流程執行邏輯
            // 找到所有 webhook-trigger 節點，每個都是獨立的流程起點
            const triggerNodes = workflow.nodes.filter(n => n.data.type === 'webhook-trigger');
            console.log(`🔍 找到 ${triggerNodes.length} 個webhook-trigger節點`);
            
            for (const triggerNode of triggerNodes) {
              console.log(`🔧 執行獨立流程起點: ${triggerNode.id} (${triggerNode.data.type})`);
              const result = await executeNode(triggerNode, context);
              results.push({ nodeId: triggerNode.id, result });
              context[triggerNode.id] = result.data;
              context._lastResult = result;
              
              // 找到這個 trigger 連接的條件節點（只考慮啟用的邊）
              const connectedConditionEdges = workflow.edges.filter(edge => 
                edge.source === triggerNode.id && 
                edge.data?.active !== false &&
                workflow.nodes.find(n => n.id === edge.target && n.data.type === 'condition')
              );
              
              let conditionMatched = false;
              let replyTokenUsed = false;
              
              // 執行連接到這個 trigger 的條件節點
              for (const edge of connectedConditionEdges) {
                const conditionNode = workflow.nodes.find(n => n.id === edge.target);
                if (conditionNode) {
                  console.log(`🔧 執行條件節點: ${conditionNode.id} (${conditionNode.data.type})`);
                  const conditionResult = await executeNode(conditionNode, context);
                  results.push({ nodeId: conditionNode.id, result: conditionResult });
                  context[conditionNode.id] = conditionResult.data;
                  context._lastResult = conditionResult;
                  
                  // 如果條件為 true，執行所有連接的節點（只考慮啟用的邊）
                  if (conditionResult.data) {
                    const actionEdges = workflow.edges.filter(e => e.source === conditionNode.id && e.data?.active !== false);
                    for (const actionEdge of actionEdges) {
                      const actionNode = workflow.nodes.find(n => n.id === actionEdge.target);
                      if (actionNode) {
                        console.log(`✅ 條件為 true，執行連接的節點: ${actionNode.id}`);
                        
                        const actionResult = await executeNode(actionNode, context);
                        results.push({ nodeId: actionNode.id, result: actionResult });
                        
                        if (actionResult.success) {
                          context[actionNode.id] = actionResult.data;
                          context._lastResult = actionResult;
                          
                          // 如果是 Switch 節點，繼續執行匹配的分支
                          if (actionNode.data.type === 'switch' && actionResult.branch) {
                            console.log(`🔀 Switch節點執行完成，繼續執行分支: ${actionResult.branch}`);
                            
                            // 找到對應分支的邊
                            const branchEdges = workflow.edges.filter(branchEdge => 
                              branchEdge.source === actionNode.id && 
                              branchEdge.data?.active !== false &&
                              branchEdge.data?.branch === actionResult.branch
                            );
                            
                            console.log(`🔀 找到 ${branchEdges.length} 條 ${actionResult.branch} 分支`);
                            
                            // 執行對應分支的節點
                            for (const branchEdge of branchEdges) {
                              const branchNode = workflow.nodes.find(n => n.id === branchEdge.target);
                              if (branchNode) {
                                console.log(`▶️ 執行Switch分支節點: ${branchNode.id}`);
                                const branchResult = await executeNode(branchNode, context);
                                results.push({ nodeId: branchNode.id, result: branchResult });
                                
                                if (branchResult.success) {
                                  context[branchNode.id] = branchResult.data;
                                  context._lastResult = branchResult;
                                  
                                  // 如果是條件節點或IF條件節點，根據結果繼續執行
                                  if ((branchNode.data.type === 'condition' && branchResult.data === true) ||
                                      (branchNode.data.type === 'if-condition' && branchResult.branch)) {
                                    console.log(`✅ 條件節點 ${branchNode.id} 結果為 ${branchResult.data || branchResult.branch}，繼續執行連接的節點`);
                                    
                                    // 對於IF條件節點，需要根據分支選擇邊
                                    let conditionActionEdges;
                                    if (branchNode.data.type === 'if-condition') {
                                      conditionActionEdges = workflow.edges.filter(e => 
                                        e.source === branchNode.id && 
                                        e.data?.active !== false &&
                                        (e.data?.branch === branchResult.branch || (!e.data?.branch && branchResult.branch === 'true'))
                                      );
                                    } else {
                                      conditionActionEdges = workflow.edges.filter(e => 
                                        e.source === branchNode.id && e.data?.active !== false
                                      );
                                    }
                                    
                                    console.log(`🔀 找到 ${conditionActionEdges.length} 條 ${branchResult.branch || 'true'} 分支邊`);
                                    
                                    for (const conditionActionEdge of conditionActionEdges) {
                                      const conditionActionNode = workflow.nodes.find(n => n.id === conditionActionEdge.target);
                                      if (conditionActionNode) {
                                        console.log(`▶️ 執行條件連接的節點: ${conditionActionNode.id}`);
                                        const conditionActionResult = await executeNode(conditionActionNode, context);
                                        results.push({ nodeId: conditionActionNode.id, result: conditionActionResult });
                                        
                                        if (conditionActionResult.success) {
                                          context[conditionActionNode.id] = conditionActionResult.data;
                                          context._lastResult = conditionActionResult;
                                        } else {
                                          console.log(`❌ 條件連接節點 ${conditionActionNode.id} 執行失敗: ${conditionActionResult.error}`);
                                          context._lastResult = conditionActionResult;
                                        }
                                      }
                                    }
                                  }
                                } else {
                                  console.log(`❌ Switch分支節點 ${branchNode.id} 執行失敗: ${branchResult.error}`);
                                  context._lastResult = branchResult;
                                }
                              }
                            }
                          }
                          
                          // 如果是 LINE reply 或 carousel 且成功，標記 replyToken 已使用
                          if ((actionNode.data.type === 'line-reply' || actionNode.data.type === 'line-carousel') && 
                              actionResult.data && actionResult.data.mode !== 'push') {
                            replyTokenUsed = true;
                          }
                        } else {
                          // 節點執行失敗時，記錄錯誤並停止執行
                          console.log(`❌ 節點 ${actionNode.id} 執行失敗: ${actionResult.error}`);
                          context._lastResult = actionResult;
                        }
                      }
                    }
                    
                    if (actionEdges.length > 0) {
                      conditionMatched = true;
                    }
                  }
                }
              }
              
              // 如果沒有條件匹配，執行直接連接到 trigger 的預設節點（只考慮啟用的邊）
              if (!conditionMatched) {
                const defaultEdges = workflow.edges.filter(edge => 
                  edge.source === triggerNode.id && 
                  edge.data?.active !== false &&
                  !workflow.nodes.find(n => n.id === edge.target && n.data.type === 'condition')
                );
                
                for (const edge of defaultEdges) {
                  const defaultNode = workflow.nodes.find(n => n.id === edge.target);
                  if (defaultNode) {
                    console.log(`💬 執行預設節點: ${defaultNode.id}`);
                    const defaultResult = await executeNode(defaultNode, context);
                    results.push({ nodeId: defaultNode.id, result: defaultResult });
                    
                    if (defaultResult.success) {
                      context[defaultNode.id] = defaultResult.data;
                      context._lastResult = defaultResult;
                      
                      // 如果是 Switch 節點，繼續執行匹配的分支
                      if (defaultNode.data.type === 'switch' && defaultResult.branch) {
                        console.log(`🔀 Switch節點執行完成，繼續執行分支: ${defaultResult.branch}`);
                        
                        // 找到對應分支的邊
                        const branchEdges = workflow.edges.filter(branchEdge => 
                          branchEdge.source === defaultNode.id && 
                          branchEdge.data?.active !== false &&
                          branchEdge.data?.branch === defaultResult.branch
                        );
                        
                        console.log(`🔀 找到 ${branchEdges.length} 條 ${defaultResult.branch} 分支`);
                        
                        // 執行對應分支的節點
                        for (const branchEdge of branchEdges) {
                          const branchNode = workflow.nodes.find(n => n.id === branchEdge.target);
                          if (branchNode) {
                            console.log(`▶️ 執行Switch分支節點: ${branchNode.id}`);
                            const branchResult = await executeNode(branchNode, context);
                            results.push({ nodeId: branchNode.id, result: branchResult });
                            
                            if (branchResult.success) {
                              context[branchNode.id] = branchResult.data;
                              context._lastResult = branchResult;
                              
                              // 如果是條件節點或IF條件節點，根據結果繼續執行
                              if ((branchNode.data.type === 'condition' && branchResult.data === true) ||
                                  (branchNode.data.type === 'if-condition' && branchResult.branch)) {
                                console.log(`✅ 條件節點 ${branchNode.id} 結果為 ${branchResult.data || branchResult.branch}，繼續執行連接的節點`);
                                
                                // 對於IF條件節點，需要根據分支選擇邊
                                let conditionActionEdges;
                                if (branchNode.data.type === 'if-condition') {
                                  conditionActionEdges = workflow.edges.filter(e => 
                                    e.source === branchNode.id && 
                                    e.data?.active !== false &&
                                    (e.data?.branch === branchResult.branch || (!e.data?.branch && branchResult.branch === 'true'))
                                  );
                                } else {
                                  conditionActionEdges = workflow.edges.filter(e => 
                                    e.source === branchNode.id && e.data?.active !== false
                                  );
                                }
                                
                                console.log(`🔀 找到 ${conditionActionEdges.length} 條 ${branchResult.branch || 'true'} 分支邊`);
                                
                                for (const conditionActionEdge of conditionActionEdges) {
                                  const conditionActionNode = workflow.nodes.find(n => n.id === conditionActionEdge.target);
                                  if (conditionActionNode) {
                                    console.log(`▶️ 執行條件連接的節點: ${conditionActionNode.id}`);
                                    const conditionActionResult = await executeNode(conditionActionNode, context);
                                    results.push({ nodeId: conditionActionNode.id, result: conditionActionResult });
                                    
                                    if (conditionActionResult.success) {
                                      context[conditionActionNode.id] = conditionActionResult.data;
                                      context._lastResult = conditionActionResult;
                                    } else {
                                      console.log(`❌ 條件連接節點 ${conditionActionNode.id} 執行失敗: ${conditionActionResult.error}`);
                                      context._lastResult = conditionActionResult;
                                    }
                                  }
                                }
                              }
                            } else {
                              console.log(`❌ Switch分支節點 ${branchNode.id} 執行失敗: ${branchResult.error}`);
                              context._lastResult = branchResult;
                            }
                          }
                        }
                      }
                    } else {
                      // 節點執行失敗時，記錄錯誤
                      console.log(`❌ 預設節點 ${defaultNode.id} 執行失敗: ${defaultResult.error}`);
                      context._lastResult = defaultResult;
                    }
                    break;
                  }
                }
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

// 調試API端點
// 開始調試執行
app.post('/api/debug/start/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const { inputData = {}, breakpoints = [], stepMode = true } = req.body;
  
  const workflow = workflows[workflowId];
  if (!workflow) {
    return res.status(404).json({ error: '工作流程不存在' });
  }
  
  const session = new ExecutionState(workflowId, inputData);
  session.breakpoints = new Set(breakpoints);
  session.stepMode = stepMode;
  session.nodes = workflow.nodes;
  
  executionSessions.set(session.sessionId, session);
  
  res.json({
    sessionId: session.sessionId,
    status: session.status,
    currentNode: null,
    totalNodes: workflow.nodes.length
  });
});

// 單步執行
app.post('/api/debug/step/:sessionId', async (req, res) => {
  const session = executionSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: '執行會話不存在' });
  
  try {
    const result = await executeNextNode(session);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 繼續執行
app.post('/api/debug/continue/:sessionId', async (req, res) => {
  const session = executionSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: '執行會話不存在' });
  
  try {
    session.status = 'running';
    const result = await continueExecution(session);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 暫停執行
app.post('/api/debug/pause/:sessionId', async (req, res) => {
  const session = executionSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: '執行會話不存在' });
  
  session.status = 'paused';
  res.json({ status: 'paused', currentNode: session.currentNodeId });
});

// 停止執行
app.post('/api/debug/stop/:sessionId', async (req, res) => {
  const session = executionSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: '執行會話不存在' });
  
  executionSessions.delete(req.params.sessionId);
  res.json({ status: 'stopped' });
});

// 獲取執行狀態
app.get('/api/debug/status/:sessionId', (req, res) => {
  const session = executionSessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: '執行會話不存在' });
  
  res.json({
    status: session.status,
    currentNode: session.currentNodeId,
    variables: session.variables,
    results: session.results,
    callStack: session.callStack
  });
});

// 核心執行邏輯
async function executeNextNode(session) {
  const workflow = workflows[session.workflowId];
  if (!workflow || session.currentNodeIndex >= workflow.nodes.length) {
    session.status = 'completed';
    return { status: 'completed', message: '流程執行完成' };
  }
  
  const node = workflow.nodes[session.currentNodeIndex];
  session.currentNodeId = node.id;
  
  // 檢查斷點
  if (session.breakpoints.has(node.id) && session.status === 'running') {
    session.status = 'paused';
    return {
      status: 'paused',
      currentNode: node.id,
      message: `在斷點處暫停: ${node.data.label}`
    };
  }
  
  // 執行節點
  const result = await executeNode(node, session.context);
  session.results.push({ nodeId: node.id, result });
  
  // 更新上下文
  if (result.success) {
    session.context[node.id] = result.data;
    session.context._lastResult = result;
  } else {
    session.context._lastResult = result;
  }
  
  session.variables = { ...session.context };
  
  // 處理子流程
  if (node.data.type === 'workflow-reference') {
    return await handleSubworkflow(session, node, result);
  }
  
  session.currentNodeIndex++;
  
  if (session.stepMode) {
    session.status = 'paused';
  }
  
  return {
    status: 'completed',
    currentNode: session.currentNodeId,
    result,
    variables: session.variables
  };
}

async function handleSubworkflow(session, node, result) {
  // Step Over 子流程 (預設行為)
  session.currentNodeIndex++;
  return {
    status: session.stepMode ? 'paused' : 'running',
    currentNode: session.currentNodeId,
    result,
    message: `子流程執行完成: ${node.data.workflowName}`
  };
}

async function continueExecution(session) {
  while (session.currentNodeIndex < session.nodes.length && session.status === 'running') {
    const result = await executeNextNode(session);
    if (result.status === 'paused' || result.status === 'completed') {
      return result;
    }
  }
  return { status: session.status };
}

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
  console.log('- POST /api/debug/start/:workflowId - 開始調試執行');
  console.log('- POST /api/debug/step/:sessionId - 單步執行');
  console.log('- POST /api/debug/continue/:sessionId - 繼續執行');
  console.log('\nWebhook端點已啟用:');
  console.log('- POST /webhook/:workflowId - 一般Webhook接收');
  console.log('- POST /webhook/line/:workflowId - LINE Webhook接收');
});