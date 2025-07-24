module.exports = (req, res) => {
  // 設定CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  
  // 健康檢查
  if (url === '/api/health') {
    return res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  }
  
  // 工作流程API
  if (url === '/api/workflows') {
    if (method === 'GET') {
      return res.json({ workflows: [] });
    }
    if (method === 'POST') {
      const workflowId = Date.now().toString();
      return res.json({ 
        workflowId, 
        name: req.body?.name || '新流程',
        createdAt: new Date().toISOString()
      });
    }
  }
  
  // Token API
  if (url === '/api/tokens') {
    if (method === 'GET') {
      return res.json({ tokens: [] });
    }
    if (method === 'POST') {
      return res.json({ success: true, message: 'Token 已儲存' });
    }
  }
  
  // Webhook
  if (url.startsWith('/webhook/line/')) {
    return res.json({ message: 'ok' });
  }
  
  // 404
  res.status(404).json({ error: 'Not Found' });
};