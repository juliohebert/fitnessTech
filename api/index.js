// Vercel Serverless Function - ESM
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ONLINE',
      message: 'API FitnessTech funcionando via Vercel!',
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.method === 'POST') {
    const { email, senha } = req.body || {};
    if (email === 'admin@fitness.com' && senha === '123456') {
      return res.status(200).json({
        success: true,
        token: 'test_token',
        usuario: { id: 1, email, nome: 'Admin' }
      });
    }
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }
  
  return res.status(405).json({ erro: 'Método não permitido' });
}
