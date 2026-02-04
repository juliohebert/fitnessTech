// Handler Vercel - JavaScript puro
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // GET /api
    if (req.method === 'GET') {
      return res.status(200).json({ 
        status: 'online',
        message: 'API FITNESS TECH FUNCIONANDO',
        timestamp: new Date().toISOString(),
        env: {
          hasDB: !!process.env.DATABASE_URL,
          hasJWT: !!process.env.JWT_SECRET
        }
      });
    }
    
    // POST /api/auth/login
    if (req.method === 'POST') {
      const { email, senha } = req.body || {};
      
      if (email === 'admin@fitness.com' && senha === '123456') {
        return res.status(200).json({
          success: true,
          token: 'mock_token',
          usuario: { id: 1, email, nome: 'Admin' }
        });
      }
      
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }
    
    return res.status(404).json({ erro: 'Método não permitido' });
  } catch (error) {
    return res.status(500).json({ erro: error?.message || 'Erro interno' });
  }
};
