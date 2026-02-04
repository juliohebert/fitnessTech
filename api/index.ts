// Handler Vercel sem tipos externos
export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // GET /api
    if (req.method === 'GET' && (req.url === '/api' || req.url === '/api/')) {
      return res.status(200).json({ 
        status: 'online',
        message: 'API FitnessTech funcionando!',
        timestamp: new Date().toISOString()
      });
    }
    
    // POST /api/auth/login
    if (req.method === 'POST' && req.url?.includes('/auth/login')) {
      const { email, senha } = req.body || {};
      
      // Mock para teste
      if (email === 'admin@fitness.com' && senha === '123456') {
        return res.status(200).json({
          success: true,
          token: 'mock_token_teste',
          usuario: { id: 1, email, nome: 'Admin' }
        });
      }
      
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }
    
    return res.status(404).json({ erro: 'Rota não encontrada', url: req.url });
  } catch (error: any) {
    return res.status(500).json({ erro: error?.message || 'Erro interno' });
  }
}
