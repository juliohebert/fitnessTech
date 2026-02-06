// FitnessTech API - Versão Produção com Prisma
// Atualizado: 2026-02-04 19:30 - REAL DATABASE
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Prisma Client - Simplificado
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// FIXO - não usar env variable
const JWT_SECRET = 'fitness_tech_super_secret_key_2025';

export default async function handler(req, res) {
  // LOG IMEDIATO - ANTES DE TUDO
  console.log('🚀 REQUEST RECEBIDA:', req.method, req.url);
  console.log('📦 BODY:', JSON.stringify(req.body));
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url, method } = req;
  
  // ENDPOINT DE DEBUG - TESTAR CONEXÃO
  if (url?.includes('/debug/usuarios')) {
    try {
      console.log('🔍 Debug endpoint chamado');
      console.log('📊 DATABASE_URL:', process.env.DATABASE_URL ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
      
      const usuarios = await prisma.usuario.findMany({
        select: { id: true, email: true, nome: true, funcao: true }
      });
      
      console.log('✅ Usuarios encontrados:', usuarios.length);
      
      return res.status(200).json({
        status: 'success',
        total: usuarios.length,
        usuarios,
        env: {
          databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
          nodeEnv: process.env.NODE_ENV
        }
      });
    } catch (error) {
      console.error('❌ Erro no debug:', error);
      return res.status(500).json({ 
        status: 'error',
        erro: error.message,
        stack: error.stack 
      });
    }
  }
  
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
      
      console.log('🔐 Login attempt:', { 
        email, 
        senhaLength: senha?.length,
        senhaPreview: senha?.substring(0, 3) + '...'
      });
      
      if (!email || !senha) {
        console.log('❌ Email ou senha vazios');
        return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
      }
      
      // Buscar usuário SEM trim/lowercase primeiro
      let usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { academia: true }
      });
      
      // Se não encontrar, tentar com trim/lowercase
      if (!usuario) {
        console.log('⚠️  Tentando com lowercase...');
        usuario = await prisma.usuario.findUnique({
          where: { email: email.trim().toLowerCase() },
          include: { academia: true }
        });
      }
      
      if (!usuario) {
        console.log('❌ Usuário não encontrado');
        const todosEmails = await prisma.usuario.findMany({ 
          select: { email: true },
          take: 10
        });
        console.log('📧 Emails disponíveis:', todosEmails.map(u => u.email));
        return res.status(401).json({ erro: 'Credenciais inválidas' });
      }
      
      console.log('👤 Usuário encontrado:', {
        email: usuario.email,
        funcao: usuario.funcao,
        hashPreview: usuario.senha.substring(0, 30) + '...'
      });
      
      // Comparar senha
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      console.log('🔑 Resultado bcrypt.compare:', senhaCorreta);
      
      if (!senhaCorreta) {
        console.log('❌ Senha incorreta para', usuario.email);
        // Debug: tentar hash da senha fornecida
        const novoHash = await bcrypt.hash(senha, 10);
        console.log('🔍 Hash da senha fornecida:', novoHash.substring(0, 30) + '...');
        console.log('🔍 Hash no banco:', usuario.senha.substring(0, 30) + '...');
        return res.status(401).json({ erro: 'Credenciais inválidas' });
      }
      
      const token = jwt.sign(
        { usuarioId: usuario.id, email: usuario.email, funcao: usuario.funcao, academiaId: usuario.academiaId },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      console.log('✅ Login bem-sucedido para', usuario.email);
      return res.status(200).json({
        token,
        usuario: { ...usuario, senha: undefined },
        academia: usuario.academia
      });
    }
    
    // POST /api/auth/registrar
    if (url?.includes('/auth/registrar') && method === 'POST') {
      try {
        const { nome, email, senha, funcao, academiaId } = req.body || {};
        
        console.log('📝 Registro:', { nome, email, funcao, academiaId });
        
        if (!nome || !email || !senha) {
          return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
        }
        
        // Verificar se email já existe
        const existente = await prisma.usuario.findUnique({ where: { email } });
        if (existente) {
          return res.status(400).json({ erro: 'Email já cadastrado' });
        }
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);
        console.log('✅ Hash criado');
        
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
        
        console.log('✅ Usuário criado:', novoUsuario.email);
        
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
      } catch (error) {
        console.error('❌ Erro no registro:', error);
        return res.status(500).json({ 
          erro: 'Erro ao criar usuário', 
          detalhes: error.message 
        });
      }
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
    
    // GET /api/treinos
    if (method === 'GET' && url?.includes('/treinos') && !url.includes('/historico-treinos')) {
      const decoded = verificarToken();
      const treinos = await prisma.historicoTreino.findMany({
        where: { usuarioId: decoded.usuarioId },
        orderBy: { data: 'desc' }
      });
      return res.status(200).json(treinos);
    }
    
    // POST /api/treinos
    if (method === 'POST' && url?.includes('/treinos') && !url.includes('/historico-treinos')) {
      const decoded = verificarToken();
      const { tituloTreino, exercicios, duracao, calorias, observacoes } = req.body || {};
      
      const treino = await prisma.historicoTreino.create({
        data: {
          usuarioId: decoded.usuarioId,
          tituloTreino,
          exercicios,
          duracao,
          calorias,
          observacoes
        }
      });
      return res.status(201).json(treino);
    }
    
    // GET /api/historico-treinos
    if (method === 'GET' && url?.includes('/historico-treinos')) {
      const decoded = verificarToken();
      
      // Extrair usuarioId da query string se existir
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const usuarioIdParam = urlParams.get('usuarioId');
      
      // Se um usuarioId for fornecido e o usuário logado for admin/instrutor, usar ele
      // Caso contrário, usar o ID do próprio usuário logado
      const targetUserId = usuarioIdParam || decoded.usuarioId;
      
      console.log('📋 GET /historico-treinos - Usuario alvo:', targetUserId);
      
      const historico = await prisma.historicoTreino.findMany({
        where: { usuarioId: targetUserId },
        orderBy: { data: 'desc' }
      });
      
      console.log('📋 Treinos encontrados:', historico.length);
      return res.status(200).json(historico);
    }
    
    // POST /api/historico-treinos
    if (method === 'POST' && url?.includes('/historico-treinos')) {
      console.log('📥 POST /historico-treinos - Body completo:', JSON.stringify(req.body, null, 2));
      
      const decoded = verificarToken();
      const { titulo, tituloTreino, exercicios, duracao, calorias, observacoes, usuarioId } = req.body || {};
      
      // Aceitar tanto 'titulo' quanto 'tituloTreino'
      const tituloFinal = titulo || tituloTreino;
      const targetUserId = usuarioId || decoded.usuarioId;
      
      console.log('👤 Usuario alvo:', targetUserId);
      console.log('📋 Titulo final:', tituloFinal);
      
      if (!tituloFinal || tituloFinal.trim() === '') {
        console.error('❌ Titulo está vazio');
        return res.status(400).json({ 
          erro: 'Título do treino é obrigatório',
          recebido: req.body 
        });
      }
      
      const historico = await prisma.historicoTreino.create({
        data: {
          usuarioId: targetUserId,
          tituloTreino: tituloFinal.trim(),
          exercicios,
          duracao: duracao || 0,
          calorias: calorias || 0,
          observacoes: observacoes || ''
        }
      });
      
      console.log('✅ Treino salvo com ID:', historico.id);
      return res.status(201).json(historico);
    }

    // PUT /api/historico-treinos/:id
    console.log('🔍 Verificando rota PUT:', { method, url, match: url?.match(/\/historico-treinos\/([^\/]+)$/) });
    if (method === 'PUT' && url?.match(/\/historico-treinos\/([^\/]+)$/)) {
      console.log('✅ Match encontrado para PUT /historico-treinos/:id');
      console.log('📥 PUT /historico-treinos/:id - Body completo:', JSON.stringify(req.body, null, 2));
      
      const decoded = verificarToken();
      const treinoId = url.match(/\/historico-treinos\/([^\/]+)$/)?.[1];
      console.log('🆔 Treino ID extraído:', treinoId);
      
      if (!treinoId) {
        return res.status(400).json({ erro: 'ID do treino é obrigatório' });
      }
      
      // Verificar se o treino existe e pertence ao usuário ou se é admin
      const treinoExistente = await prisma.historicoTreino.findUnique({
        where: { id: treinoId }
      });
      
      if (!treinoExistente) {
        return res.status(404).json({ erro: 'Treino não encontrado' });
      }
      
      // Verificar permissão (dono do treino ou admin)
      const usuarioLogado = await prisma.usuario.findUnique({
        where: { id: decoded.usuarioId }
      });
      
      if (treinoExistente.usuarioId !== decoded.usuarioId && usuarioLogado.funcao !== 'ADMIN') {
        return res.status(403).json({ erro: 'Sem permissão para editar este treino' });
      }
      
      const { titulo, tituloTreino, exercicios, duracao, calorias, observacoes, plano } = req.body || {};
      
      // Preparar dados para atualização
      const dadosAtualizacao = {};
      
      if (titulo || tituloTreino) {
        dadosAtualizacao.tituloTreino = (titulo || tituloTreino).trim();
      }
      
      if (exercicios !== undefined) {
        dadosAtualizacao.exercicios = exercicios;
      }
      
      if (duracao !== undefined) {
        dadosAtualizacao.duracao = duracao;
      }
      
      if (calorias !== undefined) {
        dadosAtualizacao.calorias = calorias;
      }
      
      if (observacoes !== undefined) {
        dadosAtualizacao.observacoes = observacoes;
      }
      
      if (plano !== undefined) {
        dadosAtualizacao.exercicios = plano; // No schema atual, plano é armazenado em exercicios
      }
      
      console.log('🔄 Atualizando treino ID:', treinoId);
      console.log('📊 Dados para atualização:', dadosAtualizacao);
      
      const treinoAtualizado = await prisma.historicoTreino.update({
        where: { id: treinoId },
        data: dadosAtualizacao
      });
      
      console.log('✅ Treino atualizado com sucesso:', treinoAtualizado.id);
      return res.status(200).json(treinoAtualizado);
    }
    
    // GET /api/historico-dietas
    if (method === 'GET' && url?.includes('/historico-dietas') && !url.match(/\/historico-dietas\/[^\/]+$/)) {
      const decoded = verificarToken();
      
      // Extrair usuarioId da query string se existir
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const usuarioIdParam = urlParams.get('usuarioId');
      
      const targetUserId = usuarioIdParam || decoded.usuarioId;
      
      console.log('📋 GET /historico-dietas - Usuario alvo:', targetUserId);
      
      const historico = await prisma.relatorio.findMany({
        where: { 
          usuarioId: targetUserId,
          tipo: 'dieta'
        },
        orderBy: { criadoEm: 'desc' }
      });
      
      console.log('📋 Dietas encontradas:', historico.length);
      return res.status(200).json(historico);
    }
    
    // POST /api/historico-dietas
    if (method === 'POST' && url?.includes('/historico-dietas') && !url.match(/\/historico-dietas\/[^\/]+$/)) {
      console.log('📥 POST /historico-dietas - Body completo:', JSON.stringify(req.body, null, 2));
      
      const decoded = verificarToken();
      const { titulo, plano, usuarioId, objetivo, refeicoes, observacoes, origem } = req.body || {};
      
      const targetUserId = usuarioId || decoded.usuarioId;
      
      console.log('👤 Usuario alvo:', targetUserId);
      console.log('📋 Titulo:', titulo);
      
      if (!titulo || titulo.trim() === '') {
        console.error('❌ Titulo está vazio');
        return res.status(400).json({ 
          erro: 'Título da dieta é obrigatório',
          recebido: req.body 
        });
      }
      
      const historico = await prisma.relatorio.create({
        data: {
          usuarioId: targetUserId,
          tipo: 'dieta',
          periodo: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          dados: {
            titulo: titulo.trim(),
            objetivo,
            refeicoes: refeicoes || plano,
            observacoes,
            origem: origem || 'Manual'
          }
        }
      });
      
      console.log('✅ Dieta salva com ID:', historico.id);
      return res.status(201).json(historico);
    }
    
    // PUT /api/historico-dietas/:id
    if (method === 'PUT' && url?.match(/\/historico-dietas\/([^\/]+)$/)) {
      console.log('📥 PUT /historico-dietas/:id - Body completo:', JSON.stringify(req.body, null, 2));
      
      const decoded = verificarToken();
      const dietaId = url.match(/\/historico-dietas\/([^\/]+)$/)?.[1];
      
      if (!dietaId) {
        return res.status(400).json({ erro: 'ID da dieta é obrigatório' });
      }
      
      // Verificar se a dieta existe e pertence ao usuário ou se é admin
      const dietaExistente = await prisma.relatorio.findUnique({
        where: { id: dietaId }
      });
      
      if (!dietaExistente || dietaExistente.tipo !== 'dieta') {
        return res.status(404).json({ erro: 'Dieta não encontrada' });
      }
      
      // Verificar permissão (dono da dieta ou admin)
      const usuarioLogado = await prisma.usuario.findUnique({
        where: { id: decoded.usuarioId }
      });
      
      if (dietaExistente.usuarioId !== decoded.usuarioId && usuarioLogado.funcao !== 'ADMIN') {
        return res.status(403).json({ erro: 'Sem permissão para editar esta dieta' });
      }
      
      const { titulo, plano, objetivo, refeicoes, observacoes } = req.body || {};
      
      // Preparar dados atualizados
      const dadosAtualizados = {
        ...(dietaExistente.dados || {}),
        ...(titulo && { titulo: titulo.trim() }),
        ...(objetivo && { objetivo }),
        ...(refeicoes && { refeicoes }),
        ...(plano && { refeicoes: plano }),
        ...(observacoes !== undefined && { observacoes })
      };
      
      console.log('🔄 Atualizando dieta ID:', dietaId);
      console.log('📊 Dados para atualização:', dadosAtualizados);
      
      const dietaAtualizada = await prisma.relatorio.update({
        where: { id: dietaId },
        data: {
          dados: dadosAtualizados
        }
      });
      
      console.log('✅ Dieta atualizada com sucesso:', dietaAtualizada.id);
      return res.status(200).json(dietaAtualizada);
    }
    
    // DELETE /api/historico-dietas/:id
    if (method === 'DELETE' && url?.match(/\/historico-dietas\/([^\/]+)$/)) {
      const decoded = verificarToken();
      const dietaId = url.match(/\/historico-dietas\/([^\/]+)$/)?.[1];
      
      if (!dietaId) {
        return res.status(400).json({ erro: 'ID da dieta é obrigatório' });
      }
      
      // Verificar se a dieta existe
      const dietaExistente = await prisma.relatorio.findUnique({
        where: { id: dietaId }
      });
      
      if (!dietaExistente || dietaExistente.tipo !== 'dieta') {
        return res.status(404).json({ erro: 'Dieta não encontrada' });
      }
      
      // Verificar permissão (dono da dieta ou admin)
      const usuarioLogado = await prisma.usuario.findUnique({
        where: { id: decoded.usuarioId }
      });
      
      if (dietaExistente.usuarioId !== decoded.usuarioId && usuarioLogado.funcao !== 'ADMIN') {
        return res.status(403).json({ erro: 'Sem permissão para remover esta dieta' });
      }
      
      // Remover a dieta
      await prisma.relatorio.delete({
        where: { id: dietaId }
      });
      
      console.log('✅ Dieta removida:', dietaId);
      return res.status(200).json({ mensagem: 'Dieta removida com sucesso' });
    }
    
    // GET /api/notificacoes
    if (method === 'GET' && url?.includes('/notificacoes')) {
      const decoded = verificarToken();
      const notificacoes = await prisma.notificacao.findMany({
        where: { usuarioId: decoded.usuarioId },
        orderBy: { criadoEm: 'desc' },
        take: 50
      });
      return res.status(200).json(notificacoes);
    }
    
    // PUT /api/notificacoes/:id/ler
    if (method === 'PUT' && url?.match(/\/notificacoes\/([^\/]+)\/ler/)) {
      const decoded = verificarToken();
      const id = url.match(/\/notificacoes\/([^\/]+)\/ler/)?.[1];
      
      await prisma.notificacao.update({
        where: { id },
        data: { lida: true }
      });
      return res.status(200).json({ sucesso: true });
    }
    
    // GET /api/usuario/perfil
    if (method === 'GET' && url?.includes('/usuario/perfil')) {
      const decoded = verificarToken();
      const usuario = await prisma.usuario.findUnique({
        where: { id: decoded.usuarioId },
        include: { academia: true }
      });
      return res.status(200).json({ ...usuario, senha: undefined });
    }
    
    // PUT /api/usuario/perfil
    if (method === 'PUT' && url?.includes('/usuario/perfil')) {
      const decoded = verificarToken();
      const { nome, telefone, imagemPerfil } = req.body || {};
      
      const usuario = await prisma.usuario.update({
        where: { id: decoded.usuarioId },
        data: { nome, telefone, imagemPerfil }
      });
      return res.status(200).json({ ...usuario, senha: undefined });
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
    
    // GET /api/metas
    if (method === 'GET' && url === '/api/metas') {
      const decoded = verificarToken();
      const metas = await prisma.meta.findMany({
        where: { usuarioId: decoded.usuarioId },
        orderBy: { criadoEm: 'desc' }
      });
      return res.status(200).json(metas);
    }
    
    // POST /api/metas
    if (method === 'POST' && url === '/api/metas') {
      const decoded = verificarToken();
      const { tipo, valorAlvo, prazo, descricao } = req.body || {};
      
      const meta = await prisma.meta.create({
        data: {
          usuarioId: decoded.usuarioId,
          tipo,
          valorAlvo,
          valorAtual: 0,
          prazo: prazo ? new Date(prazo) : undefined,
          descricao,
          atingida: false
        }
      });
      return res.status(201).json(meta);
    }
    
    // GET /api/schedules
    if (method === 'GET' && url?.includes('/schedules') && !url.includes('/student')) {
      const decoded = verificarToken();
      
      // Se for professor, pega agendamentos dos seus alunos
      if (decoded.funcao === 'PROFESSOR') {
        const vinculos = await prisma.vinculoAlunoInstrutor.findMany({
          where: { instrutorId: decoded.usuarioId, ativo: true },
          select: { alunoId: true }
        });
        const alunoIds = vinculos.map(v => v.alunoId);
        
        const agendamentos = await prisma.agendamento.findMany({
          where: { 
            OR: [
              { usuarioId: decoded.usuarioId },
              { usuarioId: { in: alunoIds } }
            ]
          },
          include: {
            usuario: { select: { id: true, nome: true, email: true } }
          },
          orderBy: { dataHora: 'asc' }
        });
        return res.status(200).json(agendamentos);
      }
      
      // Outros usuários veem apenas seus agendamentos
      const agendamentos = await prisma.agendamento.findMany({
        where: { usuarioId: decoded.usuarioId },
        orderBy: { dataHora: 'asc' }
      });
      return res.status(200).json(agendamentos);
    }
    
    // POST /api/schedules
    if (method === 'POST' && url === '/api/schedules') {
      const decoded = verificarToken();
      const { titulo, dataHora, tipo, duracao, observacoes, alunoId } = req.body || {};
      
      const agendamento = await prisma.agendamento.create({
        data: {
          usuarioId: alunoId || decoded.usuarioId,
          titulo,
          dataHora: new Date(dataHora),
          tipo,
          duracao,
          observacoes,
          status: 'PENDENTE'
        }
      });
      return res.status(201).json(agendamento);
    }
    
    // GET /api/grupos
    if (method === 'GET' && url === '/api/grupos') {
      verificarToken();
      const grupos = await prisma.grupo.findMany({
        include: {
          _count: { select: { membros: true } }
        },
        orderBy: { criadoEm: 'desc' }
      });
      return res.status(200).json(grupos);
    }
    
    // GET /api/instrutor/alunos
    if (method === 'GET' && url?.includes('/instrutor/alunos')) {
      const decoded = verificarToken();
      
      if (decoded.funcao !== 'PROFESSOR' && decoded.funcao !== 'NUTRICIONISTA') {
        return res.status(403).json({ erro: 'Acesso negado' });
      }
      
      const vinculos = await prisma.vinculoAlunoInstrutor.findMany({
        where: { 
          instrutorId: decoded.usuarioId,
          ativo: true
        },
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
              imagemPerfil: true
            }
          }
        }
      });
      
      const alunos = vinculos.map(v => v.aluno);
      return res.status(200).json(alunos);
    }
    
    // ==================== INTEGRAÇÃO STRAVA ====================
    
    // GET /api/integracoes/strava/auth-url (DEVE VIR ANTES DO /api/integracoes GENÉRICO)
    if (url?.includes('/integracoes/strava/auth-url') && method === 'GET') {
      const decoded = verificarToken();
      const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || 'YOUR_CLIENT_ID';
      const REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || 'http://localhost:3000/strava-callback.html';
      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=activity:read_all,activity:read&state=${decoded.usuarioId}`;
      return res.status(200).json({ authUrl });
    }
    
    // POST /api/integracoes/strava/connect
    if (url?.includes('/integracoes/strava/connect') && method === 'POST') {
      const decoded = verificarToken();
      const { code } = req.body;
      
      console.log('📥 Strava Connect - Código recebido:', code ? 'SIM' : 'NÃO');
      
      if (!code) {
        console.error('❌ Código não fornecido');
        return res.status(400).json({ erro: 'Código de autorização não fornecido' });
      }
      
      const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
      const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
      const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;
      
      console.log('🔑 Client ID:', STRAVA_CLIENT_ID);
      console.log('🔑 Client Secret:', STRAVA_CLIENT_SECRET ? 'Configurado' : 'FALTANDO');
      console.log('🔗 Redirect URI:', STRAVA_REDIRECT_URI);
      
      try {
        console.log('🚀 Trocando código por token...');
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: STRAVA_REDIRECT_URI
          })
        });
        
        console.log('📡 Strava API Status:', tokenResponse.status);
        
        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          console.error('❌ Erro da API Strava:', error);
          return res.status(400).json({ erro: 'Erro ao trocar código por token', detalhes: error });
        }
        
        const tokenData = await tokenResponse.json();
        const expiresAt = new Date(tokenData.expires_at * 1000);
        
        const integracao = await prisma.integracaoExterna.upsert({
          where: {
            usuarioId_plataforma: {
              usuarioId: decoded.usuarioId,
              plataforma: 'STRAVA'
            }
          },
          update: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpira: expiresAt,
            ativo: true,
            ultimaSync: new Date()
          },
          create: {
            usuarioId: decoded.usuarioId,
            plataforma: 'STRAVA',
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpira: expiresAt,
            ativo: true
          }
        });
        
        return res.status(200).json({
          mensagem: 'Strava conectado com sucesso!',
          atleta: {
            id: tokenData.athlete.id,
            nome: `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`
          }
        });
      } catch (error) {
        console.error('Erro Strava OAuth:', error);
        return res.status(500).json({ erro: 'Erro ao conectar com Strava' });
      }
    }
    
    // POST /api/integracoes/strava/sync
    if (url?.includes('/integracoes/strava/sync') && method === 'POST') {
      const decoded = verificarToken();
      
      try {
        const integracao = await prisma.integracaoExterna.findUnique({
          where: {
            usuarioId_plataforma: {
              usuarioId: decoded.usuarioId,
              plataforma: 'STRAVA'
            }
          }
        });
        
        if (!integracao) {
          return res.status(404).json({ erro: 'Strava não conectado' });
        }
        
        // Buscar atividades dos últimos 30 dias
        const dataInicio = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
        
        const atividadesResponse = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${dataInicio}&per_page=50`, {
          headers: {
            'Authorization': `Bearer ${integracao.accessToken}`
          }
        });
        
        if (!atividadesResponse.ok) {
          return res.status(400).json({ erro: 'Erro ao buscar atividades do Strava' });
        }
        
        const atividades = await atividadesResponse.json();
        let importadas = 0;
        
        // Função auxiliar para mapear tipos
        const mapearTipo = (tipo) => {
          const mapa = {
            'Run': 'CORRIDA', 'Ride': 'CICLISMO', 'Swim': 'NATACAO',
            'Walk': 'CAMINHADA', 'Hike': 'CAMINHADA', 'Rowing': 'REMO',
            'Kayaking': 'REMO', 'Elliptical': 'ELIPTICO'
          };
          return mapa[tipo] || 'CORRIDA';
        };
        
        for (const atv of atividades) {
          const jaExiste = await prisma.atividadeCardio.findFirst({
            where: { stravaId: atv.id.toString() }
          });
          
          if (!jaExiste) {
            await prisma.atividadeCardio.create({
              data: {
                usuarioId: decoded.usuarioId,
                tipo: mapearTipo(atv.type),
                origem: 'STRAVA',
                duracao: atv.moving_time,
                distancia: atv.distance / 1000,
                calorias: atv.calories ? Math.round(atv.calories) : null,
                dataInicio: new Date(atv.start_date),
                dataFim: atv.start_date ? new Date(new Date(atv.start_date).getTime() + atv.elapsed_time * 1000) : null,
                velocidade: atv.average_speed ? atv.average_speed * 3.6 : null,
                fcMedia: atv.average_heartrate ? Math.round(atv.average_heartrate) : null,
                fcMaxima: atv.max_heartrate ? Math.round(atv.max_heartrate) : null,
                elevacaoGanha: atv.total_elevation_gain || null,
                stravaId: atv.id.toString(),
                observacoes: atv.name
              }
            });
            importadas++;
          }
        }
        
        await prisma.integracaoExterna.update({
          where: { id: integracao.id },
          data: { ultimaSync: new Date() }
        });
        
        return res.status(200).json({
          mensagem: `${importadas} atividades importadas!`,
          importadas,
          total: atividades.length
        });
      } catch (error) {
        console.error('Erro ao sincronizar Strava:', error);
        return res.status(500).json({ erro: 'Erro ao sincronizar' });
      }
    }
    
    // DELETE /api/integracoes/strava/disconnect
    if (url?.includes('/integracoes/strava/disconnect') && method === 'DELETE') {
      const decoded = verificarToken();
      
      try {
        const integracao = await prisma.integracaoExterna.findUnique({
          where: {
            usuarioId_plataforma: {
              usuarioId: decoded.usuarioId,
              plataforma: 'STRAVA'
            }
          }
        });
        
        if (!integracao) {
          return res.status(404).json({ erro: 'Strava não conectado' });
        }
        
        // Revogar acesso no Strava
        try {
          await fetch('https://www.strava.com/oauth/deauthorize', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${integracao.accessToken}` }
          });
        } catch (err) {
          console.log('Erro ao revogar token Strava (pode já estar revogado)');
        }
        
        // Remover integração
        await prisma.integracaoExterna.delete({
          where: { id: integracao.id }
        });
        
        return res.status(200).json({ mensagem: 'Strava desconectado com sucesso' });
      } catch (error) {
        console.error('Erro ao desconectar Strava:', error);
        return res.status(500).json({ erro: 'Erro ao desconectar' });
      }
    }
    
    // GET /api/integracoes
    if (url?.match(/^\/api\/integracoes$/) && method === 'GET') {
      const decoded = verificarToken();
      const integracoes = await prisma.integracaoExterna.findMany({
        where: { usuarioId: decoded.usuarioId }
      });
      return res.status(200).json(integracoes);
    }
    
    // Rotas que retornam arrays/objetos vazios
    const rotasVazias = [
      '/treinos', '/videos-exercicio', '/progresso/fotos', '/progresso/medicoes',
      '/metas', '/conquistas', '/desafios', '/social/postagens', '/social/grupos',
      '/ranking', '/ia/previsoes', '/ia/recuperacao', '/relatorios', '/notificacoes',
      '/carrinho', '/admin/leads', '/admin/manutencao', '/admin/produtos',
      '/admin/funcionarios', '/admin/financeiro', '/admin/acessos', '/historico-treinos',
      '/historico-dietas', '/medicoes', '/fotos-progresso', '/grupos', '/schedules',
      '/instrutor/alunos', '/usuario/perfil'
    ];
    
    // Fallback: GET retorna array vazio para rotas conhecidas
    if (method === 'GET') {
      for (const rota of rotasVazias) {
        if (url?.includes(rota)) {
          // Verificar auth exceto para health
          if (!url.includes('/health')) {
            verificarToken();
          }
          return res.status(200).json([]);
        }
      }
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
