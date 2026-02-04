import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

// Prisma singleton
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const JWT_SECRET = process.env.JWT_SECRET || 'fitness_tech_super_secret_key_2025';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Rota de teste
app.get('/api', (req, res) => {
  res.json({ message: 'API FitnessTech funcionando!' });
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('Tentando login:', email);
    
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
    
    res.json({ token, usuario: { ...usuario, senha: undefined }, academia: usuario.academia });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// Export para Vercel
export default app;
