export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  
  // 路由處理
  if (url === '/api/health') {
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
  
  if (url === '/api/workflows') {
    return res.json({ workflows: [] });
  }
  
  if (url === '/api/tokens') {
    return res.json({ tokens: [] });
  }
  
  res.status(404).json({ error: 'Not Found' });
}