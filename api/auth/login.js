export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }
  
  const { email, senha } = req.body || {};
  
  if (email === 'admin@fitness.com' && senha === '123456') {
    return res.status(200).json({
      success: true,
      token: 'mock_token_123',
      usuario: { id: 1, email, nome: 'Admin', funcao: 'ADMIN' }
    });
  }
  
  return res.status(401).json({ erro: 'Credenciais inválidas' });
}
