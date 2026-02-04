// Vercel API Router - Todas as rotas
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url, method } = req;
  
  // POST /api/auth/login
  if (url?.includes('/auth/login') && method === 'POST') {
    const { email, senha } = req.body || {};
    if (email === 'admin@fitness.com' && senha === '123456') {
      return res.status(200).json({
        success: true,
        token: 'mock_jwt_token_12345',
        usuario: { id: 1, email, nome: 'Administrador', funcao: 'ADMIN' }
      });
    }
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }
  
  // GET /api/auth/me
  if (method === 'GET' && url?.includes('/auth/me')) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ erro: 'Não autorizado' });
    
    return res.status(200).json({
      user: {
        id: 1,
        email: 'admin@fitness.com',
        nome: 'Administrador',
        funcao: 'ADMIN',
        academiaId: 1
      },
      academia: {
        id: 1,
        nome: 'FitnessTech Academia',
        cnpj: '12.345.678/0001-00'
      }
    });
  }
  
  // GET /api - Health check
  if (method === 'GET' && (!url || url === '/api' || url === '/api/')) {
    return res.status(200).json({ 
      status: 'ONLINE',
      message: 'FitnessTech API v1.0',
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(404).json({ erro: 'Rota não encontrada', url, method });
}
