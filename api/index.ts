import type { VercelRequest, VercelResponse } from '@vercel/node';

// Handler simplificado para debug
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Rota raiz
    if (req.url === '/api' || req.url === '/api/') {
      return res.status(200).json({ 
        message: 'API FitnessTech funcionando!',
        env: {
          hasDatabase: !!process.env.DATABASE_URL,
          hasJWT: !!process.env.JWT_SECRET,
          nodeVersion: process.version
        }
      });
    }
    
    // Rota de login - por enquanto mockada para testar
    if (req.url?.includes('/api/auth/login') && req.method === 'POST') {
      const { email, senha } = req.body || {};
      
      console.log('Login attempt:', email);
      
      // Mock temporário
      if (email === 'admin@fitness.com' && senha === '123456') {
        return res.status(200).json({
          token: 'mock_token_123',
          usuario: { id: 1, email, nome: 'Admin', funcao: 'ADMIN' }
        });
      }
      
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }
    
    return res.status(404).json({ erro: 'Rota não encontrada' });
  } catch (error: any) {
    console.error('Erro na API:', error);
    return res.status(500).json({ erro: error.message || 'Erro interno' });
  }
}
