// Teste simples para verificar se serverless está funcionando
export default async function handler(req: any, res: any) {
  res.status(200).json({ 
    message: 'API funcionando!',
    method: req.method,
    url: req.url,
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
