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
  
  // Função auxiliar para verificar token
  const verificarToken = () => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error('Não autorizado');
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET);
  };
  
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
    
    // POST /api/auth/registrar
    if (url?.includes('/auth/registrar') && method === 'POST') {
      const { nome, email, senha, funcao, academiaId } = req.body || {};
      
      // Verificar se email já existe
      const existente = await prisma.usuario.findUnique({ where: { email } });
      if (existente) {
        return res.status(400).json({ erro: 'Email já cadastrado' });
      }
      
      // Hash da senha
      const senhaHash = await bcrypt.hash(senha, 10);
      
      // Criar usuário
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: senhaHash,
          funcao: funcao || 'ALUNO',
          academiaId: academiaId || null
        },
        include: { academia: true }
      });
      
      const token = jwt.sign(
        { usuarioId: novoUsuario.id, email: novoUsuario.email, funcao: novoUsuario.funcao, academiaId: novoUsuario.academiaId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.status(201).json({
        token,
        usuario: { ...novoUsuario, senha: undefined },
        academia: novoUsuario.academia
      });
    }
    
    // GET /api/auth/me
    if (method === 'GET' && url?.includes('/auth/me')) {
      const decoded = verificarToken();
      
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
    
    // GET /api/admin/usuarios
    if (method === 'GET' && url?.includes('/admin/usuarios')) {
      verificarToken();
      const usuarios = await prisma.usuario.findMany({
        select: { 
          id: true, 
          nome: true, 
          email: true, 
          funcao: true, 
          criadoEm: true,
          academiaId: true
        },
        orderBy: { criadoEm: 'desc' }
      });
      return res.status(200).json(usuarios);
    }
    
    // POST /api/admin/usuarios (criar novo usuário)
    if (method === 'POST' && url?.includes('/admin/usuarios')) {
      verificarToken();
      const { nome, email, senha, funcao, academiaId } = req.body || {};
      
      const senhaHash = await bcrypt.hash(senha, 10);
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: senhaHash,
          funcao: funcao || 'ALUNO',
          academiaId: academiaId || null
        }
      });
      
      return res.status(201).json({ ...novoUsuario, senha: undefined });
    }
    
    // GET /api/admin/instrutores
    if (method === 'GET' && url?.includes('/admin/instrutores')) {
      verificarToken();
      const instrutores = await prisma.usuario.findMany({
        where: { funcao: 'PROFESSOR' },
        select: { id: true, nome: true, email: true }
      });
      return res.status(200).json(instrutores);
    }
    
    // POST /api/admin/vinculos
    if (method === 'POST' && url?.includes('/admin/vinculos')) {
      verificarToken();
      const { alunoId, professorId } = req.body || {};
      
      // Atualizar o aluno com o professor vinculado
      await prisma.usuario.update({
        where: { id: parseInt(alunoId) },
        data: { professorId: parseInt(professorId) }
      });
      
      return res.status(200).json({ sucesso: true });
    }
    
    // GET /api/admin/estatisticas
    if (method === 'GET' && url?.includes('/admin/estatisticas')) {
      verificarToken();
      const totalUsuarios = await prisma.usuario.count();
      const totalAlunos = await prisma.usuario.count({ where: { funcao: 'ALUNO' } });
      const totalProfessores = await prisma.usuario.count({ where: { funcao: 'PROFESSOR' } });
      
      // Novos membros do mês
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const novosMembros = await prisma.usuario.count({
        where: {
          criadoEm: { gte: inicioMes }
        }
      });
      
      return res.status(200).json({
        totalUsuarios,
        totalAlunos,
        totalProfessores,
        novosMembros,
        totalTreinos: 0
      });
    }
    
    // GET /api/refeicoes-diario
    if (method === 'GET' && url?.includes('/refeicoes-diario')) {
      verificarToken();
      return res.status(200).json([]);
    }
    
    // GET /api/analises-composicao
    if (method === 'GET' && url?.includes('/analises-composicao')) {
      verificarToken();
      return res.status(200).json([]);
    }
    
    // GET /api/conteudos-educacionais
    if (method === 'GET' && url?.includes('/conteudos-educacionais')) {
      verificarToken();
      return res.status(200).json([]);
    }
    
    // GET /api/usuarios (fallback)
    if (method === 'GET' && url?.includes('/usuarios')) {
      verificarToken();
      const usuarios = await prisma.usuario.findMany({
        select: { id: true, nome: true, email: true, funcao: true, criadoEm: true }
      });
      return res.status(200).json(usuarios);
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
    
    // Erro de autenticação
    if (error.message === 'Não autorizado' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ erro: 'Não autorizado' });
    }
    
    return res.status(500).json({ erro: 'Erro interno do servidor', detalhes: error.message });
  }
}
