import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Estende o tipo Request para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        email: string;
        funcao: string;
        academiaId: string | null;
      };
    }
  }
}

/**
 * Verifica se o usuário é ADMIN da academia
 */
export const verificarAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Não autenticado' });
    }

    if (req.usuario.funcao !== 'ADMIN') {
      return res.status(403).json({ erro: 'Apenas administradores podem realizar esta ação' });
    }

    next();
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao verificar permissões' });
  }
};

/**
 * Verifica se o usuário pode acessar os dados de um aluno específico
 * ADMIN: acessa todos os alunos da academia
 * PROFESSOR/NUTRI: acessa apenas seus alunos vinculados
 * ALUNO: acessa apenas seus próprios dados
 */
export const verificarAcessoAluno = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Não autenticado' });
    }

    const alunoId = req.params.alunoId || req.body.alunoId || req.query.alunoId;

    if (!alunoId) {
      return res.status(400).json({ erro: 'ID do aluno não fornecido' });
    }

    const { id: usuarioId, funcao, academiaId } = req.usuario;

    // ADMIN pode acessar qualquer aluno da mesma academia
    if (funcao === 'ADMIN') {
      const aluno = await prisma.usuario.findUnique({
        where: { id: alunoId as string }
      });

      if (!aluno || aluno.academiaId !== academiaId) {
        return res.status(403).json({ erro: 'Acesso negado a este aluno' });
      }

      return next();
    }

    // ALUNO pode acessar apenas seus próprios dados
    if (funcao === 'ALUNO') {
      if (alunoId !== usuarioId) {
        return res.status(403).json({ erro: 'Você só pode acessar seus próprios dados' });
      }
      return next();
    }

    // PROFESSOR ou NUTRI: verificar vínculo
    if (funcao === 'PROFESSOR' || funcao === 'NUTRI') {
      const vinculo = await prisma.vinculoAlunoInstrutor.findFirst({
        where: {
          alunoId: alunoId as string,
          instrutorId: usuarioId,
          tipoInstrutor: funcao,
          ativo: true
        }
      });

      if (!vinculo) {
        return res.status(403).json({ erro: 'Você não tem acesso a este aluno' });
      }

      return next();
    }

    res.status(403).json({ erro: 'Permissão negada' });
  } catch (erro) {
    console.error('Erro ao verificar acesso:', erro);
    res.status(500).json({ erro: 'Erro ao verificar permissões' });
  }
};

/**
 * Retorna lista de alunos que o usuário pode acessar
 */
export const obterAlunosAcessiveis = async (usuarioId: string, funcao: string, academiaId: string | null) => {
  try {
    // ADMIN: todos os alunos da academia
    if (funcao === 'ADMIN') {
      return await prisma.usuario.findMany({
        where: {
          academiaId: academiaId || undefined,
          funcao: 'ALUNO',
          ativo: true
        },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          imagemPerfil: true,
          criadoEm: true
        }
      });
    }

    // PROFESSOR ou NUTRI: apenas alunos vinculados
    if (funcao === 'PROFESSOR' || funcao === 'NUTRI') {
      const vinculos = await prisma.vinculoAlunoInstrutor.findMany({
        where: {
          instrutorId: usuarioId,
          tipoInstrutor: funcao,
          ativo: true
        },
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
              imagemPerfil: true,
              criadoEm: true
            }
          }
        }
      });

      return vinculos.map(v => v.aluno);
    }

    // ALUNO: retorna vazio (não gerencia outros alunos)
    return [];
  } catch (erro) {
    console.error('Erro ao obter alunos acessíveis:', erro);
    return [];
  }
};

/**
 * Retorna lista de professores/nutricionistas que o usuário pode gerenciar
 */
export const obterInstrutoresAcessiveis = async (usuarioId: string, funcao: string, academiaId: string | null) => {
  try {
    // Apenas ADMIN pode gerenciar professores e nutricionistas
    if (funcao !== 'ADMIN') {
      return [];
    }

    return await prisma.usuario.findMany({
      where: {
        academiaId: academiaId || undefined,
        funcao: {
          in: ['PROFESSOR', 'NUTRI']
        },
        ativo: true
      },
      select: {
        id: true,
        nome: true,
        email: true,
        funcao: true,
        telefone: true,
        imagemPerfil: true,
        criadoEm: true
      }
    });
  } catch (erro) {
    console.error('Erro ao obter instrutores acessíveis:', erro);
    return [];
  }
};
