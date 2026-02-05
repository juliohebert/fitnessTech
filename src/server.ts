import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  verificarAdmin, 
  verificarAcessoAluno, 
  obterAlunosAcessiveis,
  obterInstrutoresAcessiveis 
} from './middleware/autorizacao';

const app = express();

// Prisma Client otimizado para serverless
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const JWT_SECRET = process.env.JWT_SECRET || 'fitness_tech_super_secret_key_2025';
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
interface AuthRequest extends express.Request {
  usuario?: any;
}

const autenticar = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Não autorizado' });
  
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    console.log('Token decodificado:', decoded);
    req.usuario = {
      id: decoded.usuarioId || decoded.id,
      email: decoded.email,
      funcao: decoded.funcao || decoded.role || 'ALUNO',
      academiaId: decoded.academiaId || null
    };
    console.log('req.usuario:', req.usuario);
    next();
  } catch (err) {
    res.status(401).json({ erro: 'Token inválido' });
  }
};

// ===== ROTAS DE AUTENTICAÇÃO =====

app.post('/api/auth/registrar', async (req, res) => {
  const { email, senha, nome, role, nomeAcademia, telefone, cpf } = req.body;
  
  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    
    // Determinar ou criar a academia
    let academiaId;
    if (role === 'ADMIN' && nomeAcademia) {
      // ADMIN cria sua própria academia
      const novaAcademia = await prisma.academia.create({
        data: {
          nome: nomeAcademia,
          plano: 'PRO',
          maxUsuarios: 100,
          ativa: true
        }
      });
      academiaId = novaAcademia.id;
    } else if (req.body.academiaId) {
      // Usar academia fornecida
      academiaId = req.body.academiaId;
    } else {
      // Buscar ou criar academia padrão para desenvolvimento
      let academiaDefault = await prisma.academia.findFirst({
        where: { nome: 'FitnessTech Demo' }
      });
      
      if (!academiaDefault) {
        academiaDefault = await prisma.academia.create({
          data: {
            nome: 'FitnessTech Demo',
            plano: 'PRO',
            maxUsuarios: 1000,
            ativa: true
          }
        });
      }
      
      academiaId = academiaDefault.id;
    }
    
    const usuario = await prisma.usuario.create({
      data: { 
        email, 
        senha: senhaHash, 
        nome, 
        funcao: role || 'ALUNO',
        plano: 'free',
        telefone,
        cpf,
        academiaId
      }
    });
    
    // Buscar a academia para incluir na resposta
    const academia = await prisma.academia.findUnique({
      where: { id: academiaId }
    });
    
    const token = jwt.sign({ 
      usuarioId: usuario.id, 
      email: usuario.email,
      funcao: usuario.funcao,
      academiaId: usuario.academiaId
    }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ 
      mensagem: 'Usuário criado com sucesso', 
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        name: usuario.nome,
        role: usuario.funcao,
        academiaId: usuario.academiaId,
        avatar: usuario.imagemPerfil,
        createdAt: usuario.criadoEm
      },
      academia: academia ? {
        id: academia.id,
        name: academia.nome,
        logo: academia.logo,
        subscription: 'PRO',
        maxUsers: academia.maxUsuarios || 100,
        features: ['all']
      } : null
    });
  } catch (err: any) {
    console.error('Erro ao registrar:', err);
    res.status(400).json({ erro: 'Email já cadastrado ou dados inválidos' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  
  try {
    const usuario = await prisma.usuario.findUnique({ 
      where: { email },
      include: {
        academia: true
      }
    });
    
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign({ 
      usuarioId: usuario.id, 
      email: usuario.email,
      funcao: usuario.funcao,
      academiaId: usuario.academiaId
    }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ 
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        name: usuario.nome,
        role: usuario.funcao,
        academiaId: usuario.academiaId,
        avatar: usuario.imagemPerfil,
        createdAt: usuario.criadoEm
      },
      academia: usuario.academia ? {
        id: usuario.academia.id,
        name: usuario.academia.nome,
        logo: usuario.academia.logo,
        subscription: 'PRO',
        maxUsers: usuario.academia.maxUsuarios || 100,
        features: ['all']
      } : null
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// Rota para verificar usuário logado
app.get('/api/auth/me', autenticar, async (req: AuthRequest, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario?.id },
      include: {
        academia: true
      }
    });
    
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json({
      user: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        role: usuario.funcao,
        academiaId: usuario.academiaId,
        avatar: usuario.imagemPerfil,
        createdAt: usuario.criadoEm
      },
      academia: usuario.academia ? {
        id: usuario.academia.id,
        name: usuario.academia.nome,
        logo: usuario.academia.logo,
        subscription: 'PRO', // Padrão por agora
        maxUsers: 100,
        features: ['all']
      } : null
    });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE GERENCIAMENTO (ADMIN) =====

// Listar todos os usuários da academia (apenas ADMIN)
app.get('/api/admin/usuarios', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    console.log('🔍 [DEBUG] Usuário logado:', {
      id: req.usuario?.id,
      email: req.usuario?.email,
      funcao: req.usuario?.funcao,
      academiaId: req.usuario?.academiaId
    });

    const usuarios = await prisma.usuario.findMany({
      where: {
        academiaId: req.usuario?.academiaId || undefined
      },
      select: {
        id: true,
        nome: true,
        email: true,
        funcao: true,
        telefone: true,
        cpf: true,
        imagemPerfil: true,
        ativo: true,
        criadoEm: true
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });

    console.log('👥 [DEBUG] Usuários encontrados:', usuarios.length);
    console.log('👥 [DEBUG] Academia ID usado na consulta:', req.usuario?.academiaId);
    console.log('👥 [DEBUG] Primeiros 3 usuários:', usuarios.slice(0, 3));

    res.json(usuarios);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ erro: 'Erro ao listar usuários' });
  }
});

// Estatísticas do dashboard (apenas ADMIN)
app.get('/api/admin/estatisticas', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const academiaId = req.usuario?.academiaId;

    // Contar alunos ativos
    const alunosAtivos = await prisma.usuario.count({
      where: {
        academiaId,
        funcao: 'ALUNO',
        ativo: true
      }
    });

    // Contar total de alunos (ativos + inativos)
    const totalAlunos = await prisma.usuario.count({
      where: {
        academiaId,
        funcao: 'ALUNO'
      }
    });

    // Calcular taxa de retenção (alunos ativos / total de alunos)
    const taxaRetencao = totalAlunos > 0 
      ? Math.round((alunosAtivos / totalAlunos) * 100) 
      : 0;

    res.json({
      alunosAtivos,
      totalAlunos,
      taxaRetencao,
      alunosInativos: totalAlunos - alunosAtivos
    });
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    res.status(500).json({ erro: 'Erro ao buscar estatísticas' });
  }
});

// Aprovar/desativar usuário (apenas ADMIN)
app.patch('/api/admin/usuarios/:usuarioId/status', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.params;
    const { ativo } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        ativo,
        aprovadoPor: ativo ? req.usuario?.id : null
      }
    });

    res.json({ mensagem: 'Status atualizado com sucesso', usuario });
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ erro: 'Erro ao atualizar status do usuário' });
  }
});

// Vincular professor/nutricionista a aluno (apenas ADMIN)
app.post('/api/admin/vinculos', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { alunoId, instrutorId, tipoInstrutor } = req.body;

    // Validar tipos
    if (!['PROFESSOR', 'NUTRI'].includes(tipoInstrutor)) {
      return res.status(400).json({ erro: 'Tipo de instrutor inválido' });
    }

    // Verificar se aluno e instrutor pertencem à mesma academia
    const [aluno, instrutor] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: alunoId } }),
      prisma.usuario.findUnique({ where: { id: instrutorId } })
    ]);

    if (!aluno || !instrutor) {
      return res.status(404).json({ erro: 'Aluno ou instrutor não encontrado' });
    }

    if (aluno.academiaId !== req.usuario?.academiaId || instrutor.academiaId !== req.usuario?.academiaId) {
      return res.status(403).json({ erro: 'Usuários não pertencem à sua academia' });
    }

    if (aluno.funcao !== 'ALUNO') {
      return res.status(400).json({ erro: 'O usuário não é um aluno' });
    }

    if (instrutor.funcao !== tipoInstrutor) {
      return res.status(400).json({ erro: 'O instrutor não tem a função especificada' });
    }

    const vinculo = await prisma.vinculoAlunoInstrutor.create({
      data: {
        alunoId,
        instrutorId,
        tipoInstrutor,
        ativo: true
      }
    });

    res.json({ mensagem: 'Vínculo criado com sucesso', vinculo });
  } catch (err: any) {
    console.error('Erro ao criar vínculo:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ erro: 'Este vínculo já existe' });
    }
    res.status(500).json({ erro: 'Erro ao criar vínculo' });
  }
});

// Remover vínculo (apenas ADMIN)
app.delete('/api/admin/vinculos/:vinculoId', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { vinculoId } = req.params;

    await prisma.vinculoAlunoInstrutor.delete({
      where: { id: vinculoId }
    });

    res.json({ mensagem: 'Vínculo removido com sucesso' });
  } catch (err) {
    console.error('Erro ao remover vínculo:', err);
    res.status(500).json({ erro: 'Erro ao remover vínculo' });
  }
});

// Listar vínculos de um aluno (apenas ADMIN)
app.get('/api/admin/alunos/:alunoId/vinculos', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { alunoId } = req.params;

    const vinculos = await prisma.vinculoAlunoInstrutor.findMany({
      where: {
        alunoId: alunoId as string,
        ativo: true
      },
      include: {
        instrutor: {
          select: {
            id: true,
            nome: true,
            email: true,
            funcao: true,
            imagemPerfil: true
          }
        }
      }
    });

    res.json(vinculos);
  } catch (err) {
    console.error('Erro ao listar vínculos:', err);
    res.status(500).json({ erro: 'Erro ao listar vínculos' });
  }
});

// ===== ROTAS PARA PROFESSORES/NUTRICIONISTAS =====

// Listar meus alunos (PROFESSOR/NUTRI)
app.get('/api/instrutor/alunos', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id, funcao, academiaId } = req.usuario || {};

    if (!id || !funcao) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    const alunos = await obterAlunosAcessiveis(id, funcao, academiaId);
    res.json(alunos);
  } catch (err) {
    console.error('Erro ao listar alunos:', err);
    res.status(500).json({ erro: 'Erro ao listar alunos' });
  }
});

// Listar professores e nutricionistas (apenas ADMIN)
app.get('/api/admin/instrutores', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { id, funcao, academiaId } = req.usuario || {};

    if (!id || !funcao) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    const instrutores = await obterInstrutoresAcessiveis(id, funcao, academiaId);
    res.json(instrutores);
  } catch (err) {
    console.error('Erro ao listar instrutores:', err);
    res.status(500).json({ erro: 'Erro ao listar instrutores' });
  }
});

// ===== ROTAS DE USUÁRIO =====

app.get('/api/usuario/perfil', autenticar, async (req: AuthRequest, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario?.id },
      include: {
        academia: true
      }
    });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar perfil' });
  }
});

app.put('/api/usuario/perfil', autenticar, async (req: AuthRequest, res) => {
  try {
    console.log('📝 Atualizando perfil do usuário:', req.usuario?.id);
    console.log('📦 Dados recebidos:', req.body);
    
    // Filtrar apenas campos válidos do Usuario
    const dadosAtualizacao: any = {};
    
    if (req.body.nome !== undefined) dadosAtualizacao.nome = req.body.nome;
    if (req.body.telefone !== undefined) dadosAtualizacao.telefone = req.body.telefone;
    if (req.body.cpf !== undefined) dadosAtualizacao.cpf = req.body.cpf;
    if (req.body.imagemPerfil !== undefined) dadosAtualizacao.imagemPerfil = req.body.imagemPerfil;
    if (req.body.altura !== undefined) dadosAtualizacao.altura = req.body.altura;
    if (req.body.peso !== undefined) dadosAtualizacao.peso = req.body.peso;
    if (req.body.idade !== undefined) dadosAtualizacao.idade = req.body.idade;
    if (req.body.objetivo !== undefined) dadosAtualizacao.objetivo = req.body.objetivo;
    
    console.log('✅ Dados filtrados para atualização:', dadosAtualizacao);
    
    const usuario = await prisma.usuario.update({
      where: { id: req.usuario?.id },
      data: dadosAtualizacao
    });
    
    console.log('✅ Perfil atualizado com sucesso!');
    res.json(usuario);
  } catch (err) {
    console.error('❌ Erro ao atualizar perfil:', err);
    res.status(500).json({ erro: 'Erro ao atualizar perfil', detalhes: err instanceof Error ? err.message : 'Erro desconhecido' });
  }
});

// ===== ROTAS DE TREINOS =====

app.post('/api/treinos', autenticar, async (req: AuthRequest, res) => {
  try {
    // Apenas alunos podem criar treinos para si mesmos
    // Professores podem criar para seus alunos
    const { alunoId } = req.body;
    const usuarioIdFinal = alunoId || req.usuario?.id;

    // Se for professor tentando criar para aluno, verificar vínculo
    if (alunoId && req.usuario?.funcao === 'PROFESSOR') {
      const vinculo = await prisma.vinculoAlunoInstrutor.findFirst({
        where: {
          alunoId,
          instrutorId: req.usuario.id,
          tipoInstrutor: 'PROFESSOR',
          ativo: true
        }
      });

      if (!vinculo) {
        return res.status(403).json({ erro: 'Você não tem acesso a este aluno' });
      }
    } else if (alunoId && req.usuario?.funcao !== 'ADMIN') {
      return res.status(403).json({ erro: 'Apenas professores e administradores podem criar treinos para outros usuários' });
    }

    const treino = await prisma.historicoTreino.create({
      data: {
        usuarioId: usuarioIdFinal,
        tituloTreino: req.body.tituloTreino,
        exercicios: req.body.exercicios,
        duracao: req.body.duracao,
        calorias: req.body.calorias,
        observacoes: req.body.observacoes
      }
    });
    res.json(treino);
  } catch (err) {
    console.error('Erro ao criar treino:', err);
    res.status(500).json({ erro: 'Erro ao criar treino' });
  }
});

app.get('/api/treinos', autenticar, async (req: AuthRequest, res) => {
  try {
    const { alunoId } = req.query;
    
    let usuarioIdParaBuscar = req.usuario?.id;

    // Se está buscando treinos de um aluno específico
    if (alunoId && typeof alunoId === 'string') {
      const { id, funcao } = req.usuario || {};

      // ADMIN pode ver qualquer treino da academia
      if (funcao === 'ADMIN') {
        const aluno = await prisma.usuario.findUnique({
          where: { id: alunoId }
        });
        if (!aluno || aluno.academiaId !== req.usuario?.academiaId) {
          return res.status(403).json({ erro: 'Acesso negado' });
        }
        usuarioIdParaBuscar = alunoId;
      }
      // PROFESSOR pode ver treinos de seus alunos
      else if (funcao === 'PROFESSOR') {
        const vinculo = await prisma.vinculoAlunoInstrutor.findFirst({
          where: {
            alunoId,
            instrutorId: id,
            tipoInstrutor: 'PROFESSOR',
            ativo: true
          }
        });
        if (!vinculo) {
          return res.status(403).json({ erro: 'Você não tem acesso a este aluno' });
        }
        usuarioIdParaBuscar = alunoId;
      }
      // ALUNO só pode ver seus próprios treinos
      else if (alunoId !== id) {
        return res.status(403).json({ erro: 'Você só pode ver seus próprios treinos' });
      }
    }

    const treinos = await prisma.historicoTreino.findMany({
      where: { usuarioId: usuarioIdParaBuscar },
      orderBy: { data: 'desc' }
    });
    res.json(treinos);
  } catch (err) {
    console.error('Erro ao buscar treinos:', err);
    res.status(500).json({ erro: 'Erro ao buscar treinos' });
  }
});

app.get('/api/treinos/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const treino = await prisma.historicoTreino.findUnique({
      where: { id: req.params.id as string },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            academiaId: true
          }
        }
      }
    });

    if (!treino) {
      return res.status(404).json({ erro: 'Treino não encontrado' });
    }

    const { id, funcao, academiaId } = req.usuario || {};

    // Verificar permissões
    if (treino.usuarioId === id) {
      // É o próprio usuário
      return res.json(treino);
    }

    if (funcao === 'ADMIN' && treino.usuarioId) {
      // Admin da mesma academia - verificar se o usuário pertence à academia
      const usuario = await prisma.usuario.findUnique({ where: { id: treino.usuarioId }, select: { academiaId: true } });
      if (usuario?.academiaId === academiaId) {
        return res.json(treino);
      }
    }

    if (funcao === 'PROFESSOR') {
      // Verificar se é professor do aluno
      const vinculo = await prisma.vinculoAlunoInstrutor.findFirst({
        where: {
          alunoId: treino.usuarioId,
          instrutorId: id,
          tipoInstrutor: 'PROFESSOR',
          ativo: true
        }
      });
      if (vinculo) {
        return res.json(treino);
      }
    }

    res.status(403).json({ erro: 'Acesso negado' });
  } catch (err) {
    console.error('Erro ao buscar treino:', err);
    res.status(500).json({ erro: 'Erro ao buscar treino' });
  }
});

app.delete('/api/treinos/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    await prisma.historicoTreino.delete({
      where: { id: req.params.id as string }
    });
    res.json({ mensagem: 'Treino excluído' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir treino' });
  }
});

// ===== ROTAS DE VÍDEOS DE EXERCÍCIOS =====

app.post('/api/videos-exercicio', autenticar, async (req: AuthRequest, res) => {
  try {
    const video = await prisma.videoExercicio.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            imagemPerfil: true
          }
        }
      }
    });
    res.json(video);
  } catch (err) {
    console.error('Erro ao salvar vídeo:', err);
    res.status(500).json({ erro: 'Erro ao salvar vídeo' });
  }
});

app.get('/api/videos-exercicio', autenticar, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const videos = await prisma.videoExercicio.findMany({
      where: { 
        usuarioId: req.usuario?.id,
        ...(status && { status: status as string })
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            imagemPerfil: true
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar vídeos' });
  }
});

app.get('/api/videos-exercicio/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const video = await prisma.videoExercicio.findFirst({
      where: { 
        id: req.params.id as string,
        usuarioId: req.usuario?.id
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            imagemPerfil: true,
            funcao: true
          }
        }
      }
    });
    
    if (!video) {
      return res.status(404).json({ erro: 'Vídeo não encontrado' });
    }
    
    res.json(video);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar vídeo' });
  }
});

app.delete('/api/videos-exercicio/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    await prisma.videoExercicio.delete({
      where: { id: req.params.id as string }
    });
    res.json({ mensagem: 'Vídeo excluído' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir vídeo' });
  }
});

// Rota para instrutores avaliarem vídeos
app.put('/api/videos-exercicio/:id/avaliar', autenticar, async (req: AuthRequest, res) => {
  try {
    const { status, feedbackInstrutor } = req.body;
    
    const video = await prisma.videoExercicio.update({
      where: { id: req.params.id as string },
      data: {
        status,
        feedbackInstrutor,
        avaliadoEm: new Date(),
        avaliadoPor: req.usuario?.id
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });
    
    // Criar notificação para o aluno
    await prisma.notificacao.create({
      data: {
        usuarioId: video.usuarioId,
        titulo: 'Vídeo Avaliado!',
        mensagem: `Seu vídeo do exercício "${video.tituloExercicio}" foi ${status === 'aprovado' ? 'aprovado' : 'avaliado'}`,
        tipo: status === 'aprovado' ? 'sucesso' : 'info'
      }
    });
    
    res.json(video);
  } catch (err) {
    console.error('Erro ao avaliar vídeo:', err);
    res.status(500).json({ erro: 'Erro ao avaliar vídeo' });
  }
});

// Rota para instrutores listarem todos os vídeos pendentes
app.get('/api/videos-exercicio/pendentes/todos', autenticar, async (req: AuthRequest, res) => {
  try {
    const videos = await prisma.videoExercicio.findMany({
      where: { status: 'pendente' },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            imagemPerfil: true,
            email: true
          }
        }
      },
      orderBy: { criadoEm: 'asc' }
    });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar vídeos pendentes' });
  }
});

// ===== ROTAS DE PROGRESSO =====

app.post('/api/progresso/fotos', autenticar, async (req: AuthRequest, res) => {
  try {
    const foto = await prisma.fotoProgresso.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      }
    });
    res.json(foto);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar foto' });
  }
});

app.get('/api/progresso/fotos', autenticar, async (req: AuthRequest, res) => {
  try {
    const fotos = await prisma.fotoProgresso.findMany({
      where: { usuarioId: req.usuario?.id },
      orderBy: { data: 'desc' }
    });
    res.json(fotos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar fotos' });
  }
});

app.post('/api/progresso/medicoes', autenticar, async (req: AuthRequest, res) => {
  try {
    const medicao = await prisma.medicaoCorporal.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      }
    });
    res.json(medicao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar medição' });
  }
});

app.get('/api/progresso/medicoes', autenticar, async (req: AuthRequest, res) => {
  try {
    const medicoes = await prisma.medicaoCorporal.findMany({
      where: { usuarioId: req.usuario?.id },
      orderBy: { data: 'desc' }
    });
    res.json(medicoes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar medições' });
  }
});

// ===== ROTAS DE METAS =====

app.post('/api/metas', autenticar, async (req: AuthRequest, res) => {
  try {
    const meta = await prisma.meta.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      }
    });
    res.json(meta);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar meta' });
  }
});

app.get('/api/metas', autenticar, async (req: AuthRequest, res) => {
  try {
    const metas = await prisma.meta.findMany({
      where: { usuarioId: req.usuario?.id },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(metas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar metas' });
  }
});

app.put('/api/metas/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const meta = await prisma.meta.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(meta);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar meta' });
  }
});

app.delete('/api/metas/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    await prisma.meta.delete({
      where: { id: req.params.id as string }
    });
    res.json({ mensagem: 'Meta excluída' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir meta' });
  }
});

// ===== ROTAS DE CONQUISTAS =====

app.get('/api/conquistas', autenticar, async (req: AuthRequest, res) => {
  try {
    const conquistas = await prisma.conquista.findMany({
      where: { usuarioId: req.usuario?.id },
      orderBy: { desbloqueadoEm: 'desc' }
    });
    res.json(conquistas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar conquistas' });
  }
});

app.post('/api/conquistas', autenticar, async (req: AuthRequest, res) => {
  try {
    const conquista = await prisma.conquista.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      }
    });
    res.json(conquista);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar conquista' });
  }
});

// ===== ROTAS DE DESAFIOS =====

app.get('/api/desafios', autenticar, async (req: AuthRequest, res) => {
  try {
    const desafios = await prisma.desafio.findMany({
      where: { usuarioId: req.usuario?.id },
      orderBy: { dataFim: 'asc' }
    });
    res.json(desafios);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar desafios' });
  }
});

app.post('/api/desafios', autenticar, async (req: AuthRequest, res) => {
  try {
    const desafio = await prisma.desafio.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      }
    });
    res.json(desafio);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar desafio' });
  }
});

app.put('/api/desafios/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const desafio = await prisma.desafio.update({
      where: { id: req.params.id as string },
      data: req.body
    });
    res.json(desafio);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar desafio' });
  }
});

// ===== ROTAS SOCIAIS =====

app.get('/api/social/postagens', autenticar, async (req: AuthRequest, res) => {
  try {
    const postagens = await prisma.postagem.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            imagemPerfil: true
          }
        }
      },
      orderBy: { criadoEm: 'desc' },
      take: 50
    });
    res.json(postagens);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar postagens' });
  }
});

app.post('/api/social/postagens', autenticar, async (req: AuthRequest, res) => {
  try {
    const postagem = await prisma.postagem.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            imagemPerfil: true
          }
        }
      }
    });
    res.json(postagem);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar postagem' });
  }
});

app.post('/api/social/postagens/:id/curtir', autenticar, async (req: AuthRequest, res) => {
  try {
    const postagem = await prisma.postagem.update({
      where: { id: req.params.id as string },
      data: {
        curtidas: { increment: 1 }
      }
    });
    res.json(postagem);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao curtir postagem' });
  }
});

app.get('/api/social/grupos', async (req, res) => {
  try {
    const grupos = await prisma.grupo.findMany({
      orderBy: { totalMembros: 'desc' }
    });
    res.json(grupos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar grupos' });
  }
});

app.post('/api/social/grupos/:id/entrar', autenticar, async (req: AuthRequest, res) => {
  try {
    const membro = await prisma.membroGrupo.create({
      data: {
        grupoId: req.params.id as string,
        usuarioId: req.usuario?.id
      }
    });
    
    await prisma.grupo.update({
      where: { id: req.params.id as string },
      data: { totalMembros: { increment: 1 } }
    });
    
    res.json(membro);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao entrar no grupo' });
  }
});

// ===== ROTAS DE RANKING =====

app.get('/api/ranking', async (req, res) => {
  try {
    const rankings = await prisma.ranking.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            imagemPerfil: true
          }
        }
      },
      orderBy: { pontos: 'desc' },
      take: 100
    });
    res.json(rankings);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar ranking' });
  }
});

app.get('/api/ranking/meu', autenticar, async (req: AuthRequest, res) => {
  try {
    const ranking = await prisma.ranking.findUnique({
      where: { usuarioId: req.usuario?.id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            imagemPerfil: true
          }
        }
      }
    });
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar ranking pessoal' });
  }
});

// ===== ROTAS DE IA =====

app.get('/api/ia/previsoes', autenticar, async (req: AuthRequest, res) => {
  try {
    const previsoes = await prisma.previsaoIA.findMany({
      where: { usuarioId: req.usuario?.id },
      orderBy: { criadoEm: 'desc' },
      take: 10
    });
    res.json(previsoes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar previsões' });
  }
});

app.post('/api/ia/previsoes', autenticar, async (req: AuthRequest, res) => {
  try {
    const previsao = await prisma.previsaoIA.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      }
    });
    res.json(previsao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar previsão' });
  }
});

app.get('/api/ia/recuperacao', autenticar, async (req: AuthRequest, res) => {
  try {
    const analises = await prisma.analiseRecuperacao.findMany({
      where: { usuarioId: req.usuario?.id },
      orderBy: { data: 'desc' },
      take: 30
    });
    res.json(analises);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar análises de recuperação' });
  }
});

app.post('/api/ia/recuperacao', autenticar, async (req: AuthRequest, res) => {
  try {
    const analise = await prisma.analiseRecuperacao.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      }
    });
    res.json(analise);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar análise de recuperação' });
  }
});

// ===== ROTAS DE RELATÓRIOS =====

app.get('/api/relatorios', autenticar, async (req: AuthRequest, res) => {
  try {
    const relatorios = await prisma.relatorio.findMany({
      where: { usuarioId: req.usuario?.id },
      orderBy: { criadoEm: 'desc' }
    });
    res.json(relatorios);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar relatórios' });
  }
});

app.post('/api/relatorios', autenticar, async (req: AuthRequest, res) => {
  try {
    const relatorio = await prisma.relatorio.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      }
    });
    res.json(relatorio);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar relatório' });
  }
});

// ===== ROTAS DE NOTIFICAÇÕES =====

app.get('/api/notificacoes', autenticar, async (req: AuthRequest, res) => {
  try {
    const notificacoes = await prisma.notificacao.findMany({
      where: { usuarioId: req.usuario?.id },
      orderBy: { criadoEm: 'desc' },
      take: 50
    });
    res.json(notificacoes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar notificações' });
  }
});

app.put('/api/notificacoes/:id/ler', autenticar, async (req: AuthRequest, res) => {
  try {
    const notificacao = await prisma.notificacao.update({
      where: { id: req.params.id as string },
      data: { lida: true }
    });
    res.json(notificacao);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao marcar como lida' });
  }
});

app.put('/api/notificacoes/ler-todas', autenticar, async (req: AuthRequest, res) => {
  try {
    await prisma.notificacao.updateMany({
      where: { 
        usuarioId: req.usuario?.id,
        lida: false
      },
      data: { lida: true }
    });
    res.json({ mensagem: 'Todas notificações marcadas como lidas' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao marcar notificações' });
  }
});

// ===== ROTAS DE CARRINHO =====

app.get('/api/carrinho', autenticar, async (req: AuthRequest, res) => {
  try {
    const itens = await prisma.itemCarrinho.findMany({
      where: { usuarioId: req.usuario?.id }
    });
    res.json(itens);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar carrinho' });
  }
});

app.post('/api/carrinho', autenticar, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.itemCarrinho.create({
      data: {
        usuarioId: req.usuario?.id,
        ...req.body
      }
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao adicionar ao carrinho' });
  }
});

app.delete('/api/carrinho/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    await prisma.itemCarrinho.delete({
      where: { id: req.params.id as string }
    });
    res.json({ mensagem: 'Item removido do carrinho' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover do carrinho' });
  }
});

// ===== MÓDULO ADMINISTRATIVO =====

// ===== LEADS (CRM) =====
app.get('/api/admin/leads', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        academiaId: req.usuario?.academiaId || undefined
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
    res.json(leads);
  } catch (err) {
    console.error('Erro ao listar leads:', err);
    res.status(500).json({ erro: 'Erro ao listar leads' });
  }
});

app.post('/api/admin/leads', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { nome, telefone, email, origem, valorEstimado, observacoes } = req.body;
    
    const lead = await prisma.lead.create({
      data: {
        academiaId: req.usuario?.academiaId || '',
        nome,
        telefone,
        email,
        origem,
        valorEstimado: valorEstimado || 'R$ 150/mês',
        observacoes,
        status: 'lead'
      }
    });
    
    res.json(lead);
  } catch (err) {
    console.error('Erro ao criar lead:', err);
    res.status(500).json({ erro: 'Erro ao criar lead' });
  }
});

app.patch('/api/admin/leads/:leadId/status', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;
    
    const lead = await prisma.lead.update({
      where: { id: leadId as string },
      data: { status }
    });
    
    res.json(lead);
  } catch (err) {
    console.error('Erro ao atualizar status do lead:', err);
    res.status(500).json({ erro: 'Erro ao atualizar status do lead' });
  }
});

// ===== TICKETS DE MANUTENÇÃO =====
app.get('/api/admin/manutencao', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const tickets = await prisma.ticketManutencao.findMany({
      where: {
        academiaId: req.usuario?.academiaId || undefined
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
    res.json(tickets);
  } catch (err) {
    console.error('Erro ao listar tickets de manutenção:', err);
    res.status(500).json({ erro: 'Erro ao listar tickets de manutenção' });
  }
});

app.post('/api/admin/manutencao', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { equipamento, descricao, prioridade } = req.body;
    
    const ticket = await prisma.ticketManutencao.create({
      data: {
        academiaId: req.usuario?.academiaId || '',
        equipamento,
        descricao,
        prioridade: prioridade || 'MEDIUM',
        criadoPor: req.usuario?.id,
        status: 'OPEN'
      }
    });
    
    res.json(ticket);
  } catch (err) {
    console.error('Erro ao criar ticket de manutenção:', err);
    res.status(500).json({ erro: 'Erro ao criar ticket de manutenção' });
  }
});

app.patch('/api/admin/manutencao/:ticketId/status', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    
    const updateData: any = { status };
    if (status === 'FIXED') {
      updateData.resolvido = new Date();
    }
    
    const ticket = await prisma.ticketManutencao.update({
      where: { id: ticketId as string },
      data: updateData
    });
    
    res.json(ticket);
  } catch (err) {
    console.error('Erro ao atualizar status do ticket:', err);
    res.status(500).json({ erro: 'Erro ao atualizar status do ticket' });
  }
});

// ===== PRODUTOS =====
app.get('/api/admin/produtos', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        academiaId: req.usuario?.academiaId || undefined
      },
      include: {
        vendas: {
          take: 1,
          orderBy: { dataVenda: 'desc' }
        }
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
    res.json(produtos);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ erro: 'Erro ao listar produtos' });
  }
});

app.post('/api/admin/produtos', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { nome, categoria, preco, estoque, estoqueMinimo, descricao, urlImagem } = req.body;
    
    const produto = await prisma.produto.create({
      data: {
        academiaId: req.usuario?.academiaId || '',
        nome,
        categoria,
        preco: parseFloat(preco),
        estoque: parseInt(estoque) || 0,
        estoqueMinimo: parseInt(estoqueMinimo) || 10,
        descricao,
        urlImagem
      }
    });
    
    res.json(produto);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});

// ===== FUNCIONÁRIOS =====
app.get('/api/admin/funcionarios', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const funcionarios = await prisma.funcionario.findMany({
      where: {
        academiaId: req.usuario?.academiaId || undefined
      },
      orderBy: {
        dataAdmissao: 'desc'
      }
    });
    res.json(funcionarios);
  } catch (err) {
    console.error('Erro ao listar funcionários:', err);
    res.status(500).json({ erro: 'Erro ao listar funcionários' });
  }
});

app.post('/api/admin/funcionarios', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { nome, cargo, salario, telefone, email } = req.body;
    
    const funcionario = await prisma.funcionario.create({
      data: {
        academiaId: req.usuario?.academiaId || '',
        nome,
        cargo,
        salario: parseFloat(salario),
        telefone,
        email
      }
    });
    
    res.json(funcionario);
  } catch (err) {
    console.error('Erro ao criar funcionário:', err);
    res.status(500).json({ erro: 'Erro ao criar funcionário' });
  }
});

// ===== RELATÓRIOS FINANCEIROS =====
app.get('/api/admin/financeiro', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { ano, mes } = req.query;
    
    let where: any = {
      academiaId: req.usuario?.academiaId || undefined
    };
    
    if (ano) where.ano = parseInt(ano as string);
    if (mes) where.mes = parseInt(mes as string);
    
    const relatorios = await prisma.relatorioFinanceiro.findMany({
      where,
      orderBy: [
        { ano: 'desc' },
        { mes: 'desc' }
      ]
    });
    
    res.json(relatorios);
  } catch (err) {
    console.error('Erro ao listar relatórios financeiros:', err);
    res.status(500).json({ erro: 'Erro ao listar relatórios financeiros' });
  }
});

app.post('/api/admin/financeiro', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { mes, ano, receita, despesas, lucro, inadimplencia } = req.body;
    
    const relatorio = await prisma.relatorioFinanceiro.upsert({
      where: {
        academiaId_ano_mes: {
          academiaId: req.usuario?.academiaId || '',
          ano: parseInt(ano),
          mes: parseInt(mes)
        }
      },
      update: {
        receita: parseFloat(receita),
        despesas: parseFloat(despesas),
        lucro: parseFloat(lucro),
        inadimplencia: parseFloat(inadimplencia)
      },
      create: {
        academiaId: req.usuario?.academiaId || '',
        mes: parseInt(mes),
        ano: parseInt(ano),
        receita: parseFloat(receita),
        despesas: parseFloat(despesas),
        lucro: parseFloat(lucro),
        inadimplencia: parseFloat(inadimplencia)
      }
    });
    
    res.json(relatorio);
  } catch (err) {
    console.error('Erro ao criar/atualizar relatório financeiro:', err);
    res.status(500).json({ erro: 'Erro ao processar relatório financeiro' });
  }
});

// ===== REGISTROS DE ACESSO =====
app.get('/api/admin/acessos', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { data } = req.query;
    
    let where: any = {
      academiaId: req.usuario?.academiaId || undefined
    };
    
    if (data) {
      const dataConsulta = new Date(data as string);
      where.data = {
        gte: new Date(dataConsulta.getFullYear(), dataConsulta.getMonth(), dataConsulta.getDate()),
        lt: new Date(dataConsulta.getFullYear(), dataConsulta.getMonth(), dataConsulta.getDate() + 1)
      };
    } else {
      // Se não especificar data, pegar dados de hoje
      const hoje = new Date();
      where.data = {
        gte: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
        lt: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)
      };
    }
    
    const registros = await prisma.registroAcesso.findMany({
      where,
      orderBy: {
        hora: 'asc'
      }
    });
    
    res.json(registros);
  } catch (err) {
    console.error('Erro ao listar registros de acesso:', err);
    res.status(500).json({ erro: 'Erro ao listar registros de acesso' });
  }
});

// ===== ROTA DE HEALTH CHECK =====

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mensagem: 'API FitnessTech funcionando',
    timestamp: new Date().toISOString()
  });
});

// ===== MÓDULOS PROFESSOR/NUTRICIONISTA/ALUNO =====

// ===== HISTÓRICO DE TREINOS =====
app.get('/api/historico-treinos', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.query;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const historico = await prisma.historicoTreino.findMany({
      where: {
        usuarioId: targetUserId as string
      },
      orderBy: {
        data: 'desc'
      }
    });
    
    res.json(historico);
  } catch (err) {
    console.error('Erro ao listar histórico de treinos:', err);
    res.status(500).json({ erro: 'Erro ao listar histórico de treinos' });
  }
});

app.post('/api/historico-treinos', autenticar, async (req: AuthRequest, res) => {
  try {
    console.log('📥 ===== RECEBENDO REQUISIÇÃO =====');
    console.log('📥 Body completo:', JSON.stringify(req.body, null, 2));
    console.log('📥 Headers:', req.headers.authorization);
    
    const { usuarioId, titulo, tipoTreino, duracao, exercicios, observacoes, origem } = req.body;
    const targetUserId = usuarioId || req.usuario?.id;
    
    console.log('👤 Usuario alvo:', targetUserId);
    console.log('📋 Titulo extraído:', titulo);
    console.log('📋 Tipo do titulo:', typeof titulo);
    console.log('📋 Titulo é undefined?', titulo === undefined);
    console.log('📋 Titulo é null?', titulo === null);
    console.log('📋 Titulo é string vazia?', titulo === '');
    
    // Validações com mensagens mais claras
    if (!targetUserId) {
      console.error('❌ UserId está faltando');
      return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
    }
    
    if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
      console.error('❌ Título inválido:', { 
        titulo, 
        tipo: typeof titulo,
        body: req.body 
      });
      return res.status(400).json({ 
        erro: 'Título do treino é obrigatório e deve ser uma string não vazia',
        recebido: { 
          titulo, 
          tipo: typeof titulo,
          todasChaves: Object.keys(req.body)
        }
      });
    }
    
    const tituloFinal = titulo.trim();
    console.log('✅ Título que será salvo:', tituloFinal);
    
    const historico = await prisma.historicoTreino.create({
      data: {
        usuarioId: targetUserId,
        tituloTreino: tituloFinal,
        duracao: parseInt(duracao) || 60,
        exercicios,
        observacoes: observacoes || '',
        calorias: 0
      }
    });
    
    console.log('✅ Treino salvo no banco com ID:', historico.id);
    res.json(historico);
  } catch (err: any) {
    console.error('❌ Erro ao criar histórico de treino:', err);
    console.error('❌ Stack:', err.stack);
    res.status(500).json({ 
      erro: 'Erro interno do servidor',
      detalhes: err.message 
    });
  }
});

// PUT /api/historico-treinos/:id - Atualizar treino
app.put('/api/historico-treinos/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { titulo, exercicios, plano, duracao, observacoes } = req.body;
    
    console.log('📝 PUT /api/historico-treinos/:id');
    console.log('🆔 ID:', id);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    
    // Verificar se o treino existe
    const treinoExistente = await prisma.historicoTreino.findUnique({
      where: { id }
    });
    
    if (!treinoExistente) {
      return res.status(404).json({ erro: 'Treino não encontrado' });
    }
    
    // Verificar permissão (dono do treino ou admin)
    if (treinoExistente.usuarioId !== req.usuario?.id && req.usuario?.funcao !== 'ADMIN') {
      return res.status(403).json({ erro: 'Sem permissão para editar este treino' });
    }
    
    // Atualizar o treino
    const treinoAtualizado = await prisma.historicoTreino.update({
      where: { id },
      data: {
        ...(titulo && { tituloTreino: titulo }),
        ...(duracao && { duracao: parseInt(duracao) }),
        ...(observacoes !== undefined && { observacoes }),
        ...(exercicios && { exercicios }),
        ...(plano && { exercicios: plano }) // plano é armazenado em exercicios
      }
    });
    
    console.log('✅ Treino atualizado:', treinoAtualizado.id);
    res.json(treinoAtualizado);
  } catch (err: any) {
    console.error('❌ Erro ao atualizar treino:', err);
    res.status(500).json({ 
      erro: 'Erro ao atualizar treino',
      detalhes: err.message 
    });
  }
});

// ===== HISTÓRICO DE DIETAS =====
app.get('/api/historico-dietas', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.query;
    const targetUserId = usuarioId || req.usuario?.id;
    
    // Como não temos modelo de dietas no schema, vamos usar uma tabela de relatórios com tipo específico
    const historico = await prisma.relatorio.findMany({
      where: {
        usuarioId: targetUserId as string,
        tipo: 'dieta'
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
    
    res.json(historico);
  } catch (err) {
    console.error('Erro ao listar histórico de dietas:', err);
    res.status(500).json({ erro: 'Erro ao listar histórico de dietas' });
  }
});

app.post('/api/historico-dietas', autenticar, async (req: AuthRequest, res) => {
  try {
    console.log('📥 POST /api/historico-dietas - Recebendo dados:', JSON.stringify(req.body, null, 2));
    const { usuarioId, titulo, objetivo, refeicoes, observacoes, origem } = req.body;
    const targetUserId = usuarioId || req.usuario?.id;
    
    console.log('📥 UsuarioId:', targetUserId);
    console.log('📥 Titulo:', titulo);
    console.log('📥 Objetivo:', objetivo);
    console.log('📥 Refeicoes:', JSON.stringify(refeicoes));
    
    const historico = await prisma.relatorio.create({
      data: {
        usuarioId: targetUserId,
        tipo: 'dieta',
        periodo: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        dados: {
          titulo,
          objetivo,
          refeicoes,
          observacoes,
          origem: origem || 'Manual'
        }
      }
    });
    
    console.log('✅ Dieta criada com sucesso:', historico.id);
    res.json(historico);
  } catch (err: any) {
    console.error('❌ Erro ao criar histórico de dieta:', err);
    console.error('❌ Stack:', err.stack);
    res.status(500).json({ erro: 'Erro ao criar histórico de dieta', detalhes: err.message });
  }
});

// PUT /api/historico-dietas/:id - Atualizar dieta
app.put('/api/historico-dietas/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { titulo, objetivo, refeicoes, plano, observacoes } = req.body;
    
    console.log('📝 PUT /api/historico-dietas/:id');
    console.log('🆔 ID:', id);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    
    // Verificar se a dieta existe
    const dietaExistente = await prisma.relatorio.findUnique({
      where: { id }
    });
    
    if (!dietaExistente || dietaExistente.tipo !== 'dieta') {
      return res.status(404).json({ erro: 'Dieta não encontrada' });
    }
    
    // Verificar permissão (dono da dieta ou admin)
    if (dietaExistente.usuarioId !== req.usuario?.id && req.usuario?.funcao !== 'ADMIN') {
      return res.status(403).json({ erro: 'Sem permissão para editar esta dieta' });
    }
    
    // Preparar dados atualizados
    const dadosAtualizados = {
      ...dietaExistente.dados as any,
      ...(titulo && { titulo }),
      ...(objetivo && { objetivo }),
      ...(refeicoes && { refeicoes }),
      ...(plano && { refeicoes: plano }),
      ...(observacoes !== undefined && { observacoes })
    };
    
    // Atualizar a dieta
    const dietaAtualizada = await prisma.relatorio.update({
      where: { id },
      data: {
        dados: dadosAtualizados
      }
    });
    
    console.log('✅ Dieta atualizada:', dietaAtualizada.id);
    res.json(dietaAtualizada);
  } catch (err: any) {
    console.error('❌ Erro ao atualizar dieta:', err);
    res.status(500).json({ 
      erro: 'Erro ao atualizar dieta',
      detalhes: err.message 
    });
  }
});

// DELETE /api/historico-treinos/:id - Remover treino
app.delete('/api/historico-treinos/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o treino existe
    const treinoExistente = await prisma.historico.findUnique({
      where: { id }
    });
    
    if (!treinoExistente) {
      return res.status(404).json({ erro: 'Treino não encontrado' });
    }
    
    // Verificar permissão (dono do treino ou admin)
    if (treinoExistente.usuarioId !== req.usuario?.id && req.usuario?.funcao !== 'ADMIN') {
      return res.status(403).json({ erro: 'Sem permissão para remover este treino' });
    }
    
    // Remover o treino
    await prisma.historico.delete({
      where: { id }
    });
    
    console.log('✅ Treino removido:', id);
    res.json({ mensagem: 'Treino removido com sucesso' });
  } catch (err: any) {
    console.error('❌ Erro ao remover treino:', err);
    res.status(500).json({ 
      erro: 'Erro ao remover treino',
      detalhes: err.message 
    });
  }
});

// DELETE /api/historico-dietas/:id - Remover dieta
app.delete('/api/historico-dietas/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a dieta existe
    const dietaExistente = await prisma.relatorio.findUnique({
      where: { id }
    });
    
    if (!dietaExistente || dietaExistente.tipo !== 'dieta') {
      return res.status(404).json({ erro: 'Dieta não encontrada' });
    }
    
    // Verificar permissão (dono da dieta ou admin)
    if (dietaExistente.usuarioId !== req.usuario?.id && req.usuario?.funcao !== 'ADMIN') {
      return res.status(403).json({ erro: 'Sem permissão para remover esta dieta' });
    }
    
    // Remover a dieta
    await prisma.relatorio.delete({
      where: { id }
    });
    
    console.log('✅ Dieta removida:', id);
    res.json({ mensagem: 'Dieta removida com sucesso' });
  } catch (err: any) {
    console.error('❌ Erro ao remover dieta:', err);
    res.status(500).json({ 
      erro: 'Erro ao remover dieta',
      detalhes: err.message 
    });
  }
});

// ===== MEDIÇÕES CORPORAIS =====
app.get('/api/medicoes', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.query;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const medicoes = await prisma.medicaoCorporal.findMany({
      where: {
        usuarioId: targetUserId as string
      },
      orderBy: {
        data: 'desc'
      }
    });
    
    res.json(medicoes);
  } catch (err) {
    console.error('Erro ao listar medições:', err);
    res.status(500).json({ erro: 'Erro ao listar medições' });
  }
});

app.post('/api/medicoes', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId, peso, altura, gorduraCorporal, massaMuscular, observacoes } = req.body;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const medicao = await prisma.medicaoCorporal.create({
      data: {
        usuarioId: targetUserId,
        peso: parseFloat(peso),
        altura: parseFloat(altura),
        gorduraCorporal: gorduraCorporal ? parseFloat(gorduraCorporal) : null,
        massaMuscular: massaMuscular ? parseFloat(massaMuscular) : null
      }
    });
    
    res.json(medicao);
  } catch (err) {
    console.error('Erro ao criar medição:', err);
    res.status(500).json({ erro: 'Erro ao criar medição' });
  }
});

// ===== FOTOS DE PROGRESSO =====
app.get('/api/fotos-progresso', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.query;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const fotos = await prisma.fotoProgresso.findMany({
      where: {
        usuarioId: targetUserId as string
      },
      orderBy: {
        data: 'desc'
      }
    });
    
    res.json(fotos);
  } catch (err) {
    console.error('Erro ao listar fotos de progresso:', err);
    res.status(500).json({ erro: 'Erro ao listar fotos de progresso' });
  }
});

app.post('/api/fotos-progresso', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId, url, categoria, observacoes } = req.body;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const foto = await prisma.fotoProgresso.create({
      data: {
        usuarioId: targetUserId,
        urlImagem: url,
        observacoes: observacoes || ''
      }
    });
    
    res.json(foto);
  } catch (err) {
    console.error('Erro ao criar foto de progresso:', err);
    res.status(500).json({ erro: 'Erro ao criar foto de progresso' });
  }
});

// ===== METAS =====
app.get('/api/metas', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.query;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const metas = await prisma.meta.findMany({
      where: {
        usuarioId: targetUserId as string
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
    
    res.json(metas);
  } catch (err) {
    console.error('Erro ao listar metas:', err);
    res.status(500).json({ erro: 'Erro ao listar metas' });
  }
});

app.post('/api/metas', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId, titulo, descricao, categoria, valorAlvo, prazo } = req.body;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const meta = await prisma.meta.create({
      data: {
        usuarioId: targetUserId,
        titulo,
        descricao,
        valorAlvo: valorAlvo ? parseFloat(valorAlvo) : 0,
        unidade: 'kg',
        prazo: prazo ? new Date(prazo) : null
      }
    });
    
    res.json(meta);
  } catch (err) {
    console.error('Erro ao criar meta:', err);
    res.status(500).json({ erro: 'Erro ao criar meta' });
  }
});

app.patch('/api/metas/:metaId', autenticar, async (req: AuthRequest, res) => {
  try {
    const { metaId } = req.params;
    const { concluida, progresso } = req.body;
    
    const meta = await prisma.meta.update({
      where: { id: metaId as string },
      data: {
        completada: concluida !== undefined ? concluida : undefined,
        valorAtual: progresso !== undefined ? parseFloat(progresso) : undefined
      }
    });
    
    res.json(meta);
  } catch (err) {
    console.error('Erro ao atualizar meta:', err);
    res.status(500).json({ erro: 'Erro ao atualizar meta' });
  }
});

// ===== GRUPOS E COMUNIDADE =====
app.get('/api/grupos', autenticar, async (req: AuthRequest, res) => {
  try {
    const grupos = await prisma.grupo.findMany({
      include: {
        _count: {
          select: { membros: true }
        },
        membros: {
          take: 1,
          where: {
            usuarioId: req.usuario?.id
          }
        }
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
    
    const gruposFormatados = grupos.map(grupo => ({
      ...grupo,
      totalMembros: grupo._count.membros,
      isMembro: grupo.membros.length > 0
    }));
    
    res.json(gruposFormatados);
  } catch (err) {
    console.error('Erro ao listar grupos:', err);
    res.status(500).json({ erro: 'Erro ao listar grupos' });
  }
});

app.post('/api/grupos/:grupoId/entrar', autenticar, async (req: AuthRequest, res) => {
  try {
    const { grupoId } = req.params;
    
    const membro = await prisma.membroGrupo.create({
      data: {
        usuarioId: req.usuario!.id,
        grupoId: grupoId as string
      }
    });
    
    res.json(membro);
  } catch (err) {
    console.error('Erro ao entrar no grupo:', err);
    res.status(500).json({ erro: 'Erro ao entrar no grupo' });
  }
});

// ===== NOTIFICAÇÕES =====
app.get('/api/notificacoes', autenticar, async (req: AuthRequest, res) => {
  try {
    const notificacoes = await prisma.notificacao.findMany({
      where: {
        usuarioId: req.usuario?.id
      },
      orderBy: {
        criadoEm: 'desc'
      }
    });
    
    res.json(notificacoes);
  } catch (err) {
    console.error('Erro ao listar notificações:', err);
    res.status(500).json({ erro: 'Erro ao listar notificações' });
  }
});

app.patch('/api/notificacoes/:notifId/marcar-lida', autenticar, async (req: AuthRequest, res) => {
  try {
    const { notifId } = req.params;
    
    const notificacao = await prisma.notificacao.update({
      where: { id: notifId as string },
      data: { lida: true }
    });
    
    res.json(notificacao);
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err);
    res.status(500).json({ erro: 'Erro ao marcar notificação como lida' });
  }
});

// ===== AGENDAMENTOS =====

// Listar agendamentos do instrutor logado
app.get('/api/schedules', autenticar, async (req: AuthRequest, res) => {
  try {
    const instrutorId = req.usuario?.id;
    
    const agendamentos = await prisma.agendamento.findMany({
      where: { instrutorId },
      orderBy: [
        { data: 'desc' },
        { hora: 'asc' }
      ]
    });
    
    res.json(agendamentos);
  } catch (err) {
    console.error('Erro ao listar agendamentos:', err);
    res.status(500).json({ erro: 'Erro ao listar agendamentos' });
  }
});

// Listar agendamentos de um aluno específico
app.get('/api/schedules/student/:studentId', autenticar, async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;
    const instrutorId = req.usuario?.id;
    
    const agendamentos = await prisma.agendamento.findMany({
      where: { 
        instrutorId,
        alunoId: studentId as string 
      },
      orderBy: [
        { data: 'desc' },
        { hora: 'asc' }
      ]
    });
    
    res.json(agendamentos);
  } catch (err) {
    console.error('Erro ao listar agendamentos do aluno:', err);
    res.status(500).json({ erro: 'Erro ao listar agendamentos do aluno' });
  }
});

// Criar novo agendamento
app.post('/api/schedules', autenticar, async (req: AuthRequest, res) => {
  try {
    const instrutorId = req.usuario?.id;
    const { alunoId, data, hora, tipo, observacoes } = req.body;
    
    // Validações
    if (!alunoId || !data || !hora || !tipo) {
      return res.status(400).json({ erro: 'Dados obrigatórios faltando' });
    }
    
    const agendamento = await prisma.agendamento.create({
      data: {
        instrutorId,
        alunoId,
        data: new Date(data),
        hora,
        tipo,
        status: 'pending',
        observacoes
      }
    });
    
    res.json(agendamento);
  } catch (err) {
    console.error('Erro ao criar agendamento:', err);
    res.status(500).json({ erro: 'Erro ao criar agendamento' });
  }
});

// Atualizar agendamento
app.put('/api/schedules/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const instrutorId = req.usuario?.id;
    const { data, hora, tipo, status, observacoes } = req.body;
    
    // Verificar se o agendamento pertence ao instrutor
    const agendamentoExistente = await prisma.agendamento.findFirst({
      where: { id: id as string, instrutorId }
    });
    
    if (!agendamentoExistente) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }
    
    const updateData: any = {};
    if (data) updateData.data = new Date(data);
    if (hora) updateData.hora = hora;
    if (tipo) updateData.tipo = tipo;
    if (status) updateData.status = status;
    if (observacoes !== undefined) updateData.observacoes = observacoes;
    
    const agendamento = await prisma.agendamento.update({
      where: { id: id as string },
      data: updateData
    });
    
    res.json(agendamento);
  } catch (err) {
    console.error('Erro ao atualizar agendamento:', err);
    res.status(500).json({ erro: 'Erro ao atualizar agendamento' });
  }
});

// Deletar agendamento
app.delete('/api/schedules/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const instrutorId = req.usuario?.id;
    
    // Verificar se o agendamento pertence ao instrutor
    const agendamentoExistente = await prisma.agendamento.findFirst({
      where: { id: id as string, instrutorId }
    });
    
    if (!agendamentoExistente) {
      return res.status(404).json({ erro: 'Agendamento não encontrado' });
    }
    
    await prisma.agendamento.delete({
      where: { id: id as string }
    });
    
    res.json({ mensagem: 'Agendamento deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar agendamento:', err);
    res.status(500).json({ erro: 'Erro ao deletar agendamento' });
  }
});

// ===== DIÁRIO ALIMENTAR =====

// Listar refeições do diário alimentar
app.get('/api/refeicoes-diario', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.query;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const refeicoes = await prisma.refeicaoDiario.findMany({
      where: {
        usuarioId: targetUserId as string
      },
      orderBy: {
        data: 'desc'
      }
    });
    
    res.json(refeicoes);
  } catch (err) {
    console.error('Erro ao listar refeições do diário:', err);
    res.status(500).json({ erro: 'Erro ao listar refeições do diário' });
  }
});

// Criar registro de refeição no diário
app.post('/api/refeicoes-diario', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId, tipoRefeicao, urlImagem, horario, calorias, observacoes } = req.body;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const refeicao = await prisma.refeicaoDiario.create({
      data: {
        usuarioId: targetUserId as string,
        tipoRefeicao,
        urlImagem,
        horario,
        calorias: calorias ? parseInt(calorias) : null,
        observacoes
      }
    });
    
    res.json(refeicao);
  } catch (err) {
    console.error('Erro ao criar refeição no diário:', err);
    res.status(500).json({ erro: 'Erro ao criar refeição no diário' });
  }
});

// Atualizar feedback de refeição (nutricionista)
app.put('/api/refeicoes-diario/:id/feedback', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    const nutricionistaId = req.usuario?.id;
    
    const refeicao = await prisma.refeicaoDiario.update({
      where: { id: id as string },
      data: {
        status,
        feedback,
        avaliadoPor: nutricionistaId,
        avaliadoEm: new Date()
      }
    });
    
    res.json(refeicao);
  } catch (err) {
    console.error('Erro ao atualizar feedback da refeição:', err);
    res.status(500).json({ erro: 'Erro ao atualizar feedback da refeição' });
  }
});

// Deletar refeição do diário
app.delete('/api/refeicoes-diario/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;
    
    // Verificar se a refeição pertence ao usuário
    const refeicaoExistente = await prisma.refeicaoDiario.findFirst({
      where: { id: id as string, usuarioId }
    });
    
    if (!refeicaoExistente) {
      return res.status(404).json({ erro: 'Refeição não encontrada' });
    }
    
    await prisma.refeicaoDiario.delete({
      where: { id: id as string }
    });
    
    res.json({ mensagem: 'Refeição deletada com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar refeição:', err);
    res.status(500).json({ erro: 'Erro ao deletar refeição' });
  }
});

// ===== ANÁLISE DE COMPOSIÇÃO CORPORAL =====

// Listar análises de composição corporal
app.get('/api/analises-composicao', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId } = req.query;
    const targetUserId = usuarioId || req.usuario?.id;
    
    const analises = await prisma.analiseComposicao.findMany({
      where: {
        usuarioId: targetUserId as string
      },
      orderBy: {
        data: 'desc'
      }
    });
    
    res.json(analises);
  } catch (err) {
    console.error('Erro ao listar análises de composição:', err);
    res.status(500).json({ erro: 'Erro ao listar análises de composição' });
  }
});

// Criar análise de composição corporal
app.post('/api/analises-composicao', autenticar, async (req: AuthRequest, res) => {
  try {
    const { 
      usuarioId, 
      peso, 
      percentualGordura, 
      massaMuscular, 
      aguaCorporal,
      taxaMetabolica,
      idadeMetabolica,
      gorduraVisceral,
      observacoes 
    } = req.body;
    
    const targetUserId = usuarioId || req.usuario?.id;
    const avaliadoPor = req.usuario?.funcao === 'NUTRI' ? req.usuario.id : null;
    
    const analise = await prisma.analiseComposicao.create({
      data: {
        usuarioId: targetUserId as string,
        peso: parseFloat(peso),
        percentualGordura: percentualGordura ? parseFloat(percentualGordura) : null,
        massaMuscular: massaMuscular ? parseFloat(massaMuscular) : null,
        aguaCorporal: aguaCorporal ? parseFloat(aguaCorporal) : null,
        taxaMetabolica: taxaMetabolica ? parseFloat(taxaMetabolica) : null,
        idadeMetabolica: idadeMetabolica ? parseInt(idadeMetabolica) : null,
        gorduraVisceral: gorduraVisceral ? parseInt(gorduraVisceral) : null,
        observacoes,
        avaliadoPor
      }
    });
    
    res.json(analise);
  } catch (err) {
    console.error('Erro ao criar análise de composição:', err);
    res.status(500).json({ erro: 'Erro ao criar análise de composição' });
  }
});

// ===== CONTEÚDO EDUCACIONAL =====

// Listar conteúdos educacionais (públicos)
app.get('/api/conteudos-educacionais', autenticar, async (req: AuthRequest, res) => {
  try {
    const { categoria, tipo } = req.query;
    
    const where: any = {
      publicado: true
    };
    
    if (categoria) where.categoria = categoria;
    if (tipo) where.tipo = tipo;
    
    const conteudos = await prisma.conteudoEducacional.findMany({
      where,
      orderBy: {
        criadoEm: 'desc'
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        categoria: true,
        tipo: true,
        duracao: true,
        urlImagem: true,
        visualizacoes: true,
        criadoEm: true
      }
    });
    
    res.json(conteudos);
  } catch (err) {
    console.error('Erro ao listar conteúdos educacionais:', err);
    res.status(500).json({ erro: 'Erro ao listar conteúdos educacionais' });
  }
});

// Obter conteúdo educacional completo
app.get('/api/conteudos-educacionais/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const conteudo = await prisma.conteudoEducacional.findUnique({
      where: { id: id as string }
    });
    
    if (!conteudo) {
      return res.status(404).json({ erro: 'Conteúdo não encontrado' });
    }
    
    // Incrementar visualizações
    await prisma.conteudoEducacional.update({
      where: { id: id as string },
      data: {
        visualizacoes: {
          increment: 1
        }
      }
    });
    
    res.json(conteudo);
  } catch (err) {
    console.error('Erro ao obter conteúdo educacional:', err);
    res.status(500).json({ erro: 'Erro ao obter conteúdo educacional' });
  }
});

// Criar conteúdo educacional (nutricionista)
app.post('/api/conteudos-educacionais', autenticar, async (req: AuthRequest, res) => {
  try {
    const nutricionistaId = req.usuario?.id;
    
    if (req.usuario?.funcao !== 'NUTRI' && req.usuario?.funcao !== 'ADMIN') {
      return res.status(403).json({ erro: 'Apenas nutricionistas podem criar conteúdo' });
    }
    
    const { 
      titulo, 
      descricao, 
      categoria, 
      tipo, 
      duracao, 
      urlConteudo, 
      conteudo, 
      urlImagem,
      publicado 
    } = req.body;
    
    const novoConteudo = await prisma.conteudoEducacional.create({
      data: {
        titulo,
        descricao,
        categoria,
        tipo,
        duracao,
        urlConteudo,
        conteudo,
        urlImagem,
        publicadoPor: nutricionistaId as string,
        publicado: publicado || false
      }
    });
    
    res.json(novoConteudo);
  } catch (err) {
    console.error('Erro ao criar conteúdo educacional:', err);
    res.status(500).json({ erro: 'Erro ao criar conteúdo educacional' });
  }
});

// Atualizar conteúdo educacional
app.put('/api/conteudos-educacionais/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const nutricionistaId = req.usuario?.id;
    
    // Verificar se o conteúdo pertence ao nutricionista
    const conteudoExistente = await prisma.conteudoEducacional.findFirst({
      where: { id: id as string, publicadoPor: nutricionistaId }
    });
    
    if (!conteudoExistente && req.usuario?.funcao !== 'ADMIN') {
      return res.status(404).json({ erro: 'Conteúdo não encontrado' });
    }
    
    const conteudo = await prisma.conteudoEducacional.update({
      where: { id: id as string },
      data: req.body
    });
    
    res.json(conteudo);
  } catch (err) {
    console.error('Erro ao atualizar conteúdo educacional:', err);
    res.status(500).json({ erro: 'Erro ao atualizar conteúdo educacional' });
  }
});

// Deletar conteúdo educacional
app.delete('/api/conteudos-educacionais/:id', autenticar, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const nutricionistaId = req.usuario?.id;
    
    // Verificar se o conteúdo pertence ao nutricionista
    const conteudoExistente = await prisma.conteudoEducacional.findFirst({
      where: { id: id as string, publicadoPor: nutricionistaId }
    });
    
    if (!conteudoExistente && req.usuario?.funcao !== 'ADMIN') {
      return res.status(404).json({ erro: 'Conteúdo não encontrado' });
    }
    
    await prisma.conteudoEducacional.delete({
      where: { id: id as string }
    });
    
    res.json({ mensagem: 'Conteúdo deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar conteúdo educacional:', err);
    res.status(500).json({ erro: 'Erro ao deletar conteúdo educacional' });
  }
});

// ===== UPLOAD DE FOTO DO USUÁRIO =====
app.post('/api/usuarios/foto', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId, foto } = req.body;
    
    // Verificar se é admin ou o próprio usuário
    if (req.usuario?.funcao !== 'ADMIN' && req.usuario?.id !== usuarioId) {
      return res.status(403).json({ erro: 'Sem permissão para alterar foto deste usuário' });
    }
    
    if (!foto || !usuarioId) {
      return res.status(400).json({ erro: 'Foto e usuarioId são obrigatórios' });
    }
    
    // Atualizar a foto no banco
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: { imagemPerfil: foto }
    });
    
    res.json({ 
      mensagem: 'Foto atualizada com sucesso',
      imagemPerfil: usuarioAtualizado.imagemPerfil
    });
  } catch (err) {
    console.error('Erro ao atualizar foto:', err);
    res.status(500).json({ erro: 'Erro ao atualizar foto' });
  }
});

// ===== PAGAMENTOS E MENSALIDADES =====

// Listar pagamentos (Admin vê todos, outros veem apenas seus)
app.get('/api/pagamentos', autenticar, async (req: AuthRequest, res) => {
  try {
    const { usuarioId, mesReferencia, status } = req.query;
    
    const where: any = {};
    
    // Se não for admin, só pode ver seus próprios pagamentos
    if (req.usuario?.funcao !== 'ADMIN') {
      where.usuarioId = req.usuario?.id;
    } else if (usuarioId) {
      where.usuarioId = usuarioId;
    }
    
    if (mesReferencia) where.mesReferencia = mesReferencia;
    if (status) where.status = status;
    
    const pagamentos = await prisma.pagamento.findMany({
      where,
      orderBy: [
        { dataVencimento: 'desc' }
      ]
    });
    
    res.json(pagamentos);
  } catch (err) {
    console.error('Erro ao listar pagamentos:', err);
    res.status(500).json({ erro: 'Erro ao listar pagamentos' });
  }
});

// Criar pagamento (apenas Admin)
app.post('/api/pagamentos', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { usuarioId, valor, mesReferencia, dataVencimento, observacoes } = req.body;
    
    if (!usuarioId || !valor || !mesReferencia || !dataVencimento) {
      return res.status(400).json({ erro: 'Campos obrigatórios: usuarioId, valor, mesReferencia, dataVencimento' });
    }
    
    const pagamento = await prisma.pagamento.create({
      data: {
        usuarioId,
        valor: parseFloat(valor),
        mesReferencia,
        dataVencimento: new Date(dataVencimento),
        observacoes,
        criadoPor: req.usuario?.id || ''
      }
    });
    
    res.json(pagamento);
  } catch (err) {
    console.error('Erro ao criar pagamento:', err);
    res.status(500).json({ erro: 'Erro ao criar pagamento' });
  }
});

// Atualizar pagamento (apenas Admin)
app.put('/api/pagamentos/:id', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, metodoPagamento, dataPagamento, observacoes } = req.body;
    
    const data: any = {};
    if (status) data.status = status;
    if (metodoPagamento) data.metodoPagamento = metodoPagamento;
    if (dataPagamento) data.dataPagamento = new Date(dataPagamento);
    if (observacoes !== undefined) data.observacoes = observacoes;
    
    const pagamento = await prisma.pagamento.update({
      where: { id },
      data
    });
    
    res.json(pagamento);
  } catch (err) {
    console.error('Erro ao atualizar pagamento:', err);
    res.status(500).json({ erro: 'Erro ao atualizar pagamento' });
  }
});

// Deletar pagamento (apenas Admin)
app.delete('/api/pagamentos/:id', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await prisma.pagamento.delete({
      where: { id }
    });
    
    res.json({ mensagem: 'Pagamento deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar pagamento:', err);
    res.status(500).json({ erro: 'Erro ao deletar pagamento' });
  }
});

// Gerar mensalidades automáticas para todos os alunos ativos
app.post('/api/pagamentos/gerar-mensalidades', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { mesReferencia, valor, diaVencimento } = req.body;
    
    if (!mesReferencia || !valor || !diaVencimento) {
      return res.status(400).json({ erro: 'Campos obrigatórios: mesReferencia, valor, diaVencimento' });
    }
    
    // Buscar alunos ativos da mesma academia
    const alunos = await prisma.usuario.findMany({
      where: {
        funcao: 'ALUNO',
        ativo: true,
        academiaId: req.usuario?.academiaId
      }
    });
    
    // Criar data de vencimento
    const [ano, mes] = mesReferencia.split('-');
    const dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(diaVencimento));
    
    // Criar pagamentos em batch
    const pagamentosCriados = await Promise.all(
      alunos.map(aluno => 
        prisma.pagamento.create({
          data: {
            usuarioId: aluno.id,
            valor: parseFloat(valor),
            mesReferencia,
            dataVencimento,
            criadoPor: req.usuario?.id || ''
          }
        })
      )
    );
    
    res.json({ 
      mensagem: `${pagamentosCriados.length} mensalidades geradas com sucesso`,
      quantidade: pagamentosCriados.length
    });
  } catch (err) {
    console.error('Erro ao gerar mensalidades:', err);
    res.status(500).json({ erro: 'Erro ao gerar mensalidades' });
  }
});

// ===== GESTÃO DE PRODUTOS/ESTOQUE =====

// Listar produtos
app.get('/api/produtos', autenticar, async (req: AuthRequest, res) => {
  try {
    const { categoria, ativo } = req.query;
    
    const where: any = {
      academiaId: req.usuario?.academiaId
    };
    
    if (categoria) where.categoria = categoria;
    if (ativo !== undefined) where.ativo = ativo === 'true';
    
    const produtos = await prisma.produto.findMany({
      where,
      orderBy: { criadoEm: 'desc' }
    });
    
    res.json(produtos);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ erro: 'Erro ao listar produtos' });
  }
});

// Criar produto (apenas Admin)
app.post('/api/produtos', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { nome, categoria, preco, estoque, estoqueMinimo, descricao, urlImagem } = req.body;
    
    if (!nome || !categoria || !preco) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, categoria, preco' });
    }
    
    const produto = await prisma.produto.create({
      data: {
        academiaId: req.usuario?.academiaId || '',
        nome,
        categoria,
        preco: parseFloat(preco),
        estoque: estoque ? parseInt(estoque) : 0,
        estoqueMinimo: estoqueMinimo ? parseInt(estoqueMinimo) : 10,
        descricao,
        urlImagem
      }
    });
    
    res.json(produto);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});

// Atualizar produto (apenas Admin)
app.put('/api/produtos/:id', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { nome, categoria, preco, estoque, estoqueMinimo, descricao, urlImagem, ativo } = req.body;
    
    const data: any = {};
    if (nome) data.nome = nome;
    if (categoria) data.categoria = categoria;
    if (preco) data.preco = parseFloat(preco);
    if (estoque !== undefined) data.estoque = parseInt(estoque);
    if (estoqueMinimo !== undefined) data.estoqueMinimo = parseInt(estoqueMinimo);
    if (descricao !== undefined) data.descricao = descricao;
    if (urlImagem !== undefined) data.urlImagem = urlImagem;
    if (ativo !== undefined) data.ativo = ativo;
    
    const produto = await prisma.produto.update({
      where: { id },
      data
    });
    
    res.json(produto);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

// Deletar produto (apenas Admin)
app.delete('/api/produtos/:id', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await prisma.produto.delete({
      where: { id }
    });
    
    res.json({ mensagem: 'Produto deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ erro: 'Erro ao deletar produto' });
  }
});

// Ajustar estoque (apenas Admin)
app.post('/api/produtos/:id/ajustar-estoque', autenticar, verificarAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { quantidade, operacao } = req.body; // operacao: 'adicionar' ou 'remover'
    
    if (!quantidade || !operacao) {
      return res.status(400).json({ erro: 'Campos obrigatórios: quantidade, operacao' });
    }
    
    const produto = await prisma.produto.findUnique({
      where: { id }
    });
    
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    
    const novoEstoque = operacao === 'adicionar' 
      ? produto.estoque + parseInt(quantidade)
      : produto.estoque - parseInt(quantidade);
    
    if (novoEstoque < 0) {
      return res.status(400).json({ erro: 'Estoque não pode ser negativo' });
    }
    
    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: { estoque: novoEstoque }
    });
    
    res.json(produtoAtualizado);
  } catch (err) {
    console.error('Erro ao ajustar estoque:', err);
    res.status(500).json({ erro: 'Erro ao ajustar estoque' });
  }
});

// ===== INICIAR SERVIDOR =====

// Exportar app para Vercel serverless functions
export { app };

// Iniciar servidor apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🗄️  Banco: Neon PostgreSQL`);
    console.log(`✅ Modelos em Português`);
  });
}
