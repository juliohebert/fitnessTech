import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Prisma singleton para serverless
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const JWT_SECRET = process.env.JWT_SECRET || 'fitness_tech_super_secret_key_2025';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url, method } = req;
  
  try {
    // POST /api/auth/login
    if (url?.includes('/auth/login') && method === 'POST') {
      const { email, senha } = req.body || {};
      
      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { academia: true }
      });
      
      if (!usuario || !await bcrypt.compare(senha, usuario.senha)) {
        return res.status(401).json({ erro: 'Credenciais inválidas' });
      }
      
      const token = jwt.sign(
        { usuarioId: usuario.id, email: usuario.email, funcao: usuario.funcao, academiaId: usuario.academiaId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.status(200).json({
        token,
        usuario: { ...usuario, senha: undefined },
        academia: usuario.academia
      });
    }
    
    // GET /api/auth/me
    if (method === 'GET' && (url?.includes('/auth/me') || url?.includes('auth/me'))) {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ erro: 'Não autorizado' });
      
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.usuarioId },
        include: { academia: true }
      });
      
      if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
      
      return res.status(200).json({
        user: { ...usuario, senha: undefined },
        academia: usuario.academia
      });
    }
    
    // GET /api/usuarios
    if (method === 'GET' && url?.includes('/usuarios')) {
      const usuarios = await prisma.usuario.findMany({
        select: { id: true, nome: true, email: true, funcao: true, criadoEm: true }
      });
      return res.status(200).json(usuarios);
    }
    
    // GET /api/estatisticas
    if (method === 'GET' && url?.includes('/estatisticas')) {
      const totalUsuarios = await prisma.usuario.count();
      const totalAlunos = await prisma.usuario.count({ where: { funcao: 'ALUNO' } });
      
      return res.status(200).json({
        totalUsuarios,
        totalAlunos,
        totalTreinos: 0,
        novosMembros: 0
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
    
    // Fallback: GET retorna array vazio
    if (method === 'GET') {
      return res.status(200).json([]);
    }
    
    // Fallback: POST/PUT/DELETE
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      return res.status(501).json({ erro: 'Rota não implementada ainda' });
    }
    
    return res.status(404).json({ erro: 'Rota não encontrada' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor', detalhes: error.message });
  }
}
