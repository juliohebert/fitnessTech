// Vercel Serverless - GET /api/auth/me
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido' });
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ erro: 'Não autorizado' });
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ erro: 'Token inválido' });
    
    // Mock data - TODO: implementar JWT + Prisma
    return res.status(200).json({
      user: {
        id: 1,
        email: 'admin@fitness.com',
        nome: 'Administrador',
        funcao: 'ADMIN',
        academiaId: 1,
        createdAt: new Date().toISOString()
      },
      academia: {
        id: 1,
        nome: 'FitnessTech Academia',
        cnpj: '12.345.678/0001-00',
        endereco: 'São Paulo, SP'
      }
    });
  } catch (error) {
    console.error('Error /api/auth/me:', error);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}
