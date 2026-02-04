// Vercel Serverless Function - FitnessTech API
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET /api - Health check
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ONLINE',
      message: 'FitnessTech API v1.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    });
  }
  
  // POST /api - Login mockado para teste
  if (req.method === 'POST') {
    try {
      const { email, senha } = req.body || {};
      
      console.log('Login attempt:', email);
      
      if (email === 'admin@fitness.com' && senha === '123456') {
        return res.status(200).json({
          success: true,
          token: 'mock_jwt_token_12345',
          usuario: { 
            id: 1, 
            email, 
            nome: 'Administrador',
            funcao: 'ADMIN'
          }
        });
      }
      
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ erro: 'Erro interno no servidor' });
    }
  }
  
  return res.status(405).json({ erro: 'Método não permitido' });
}
