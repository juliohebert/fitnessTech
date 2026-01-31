
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fitness_tech_super_secret';

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE DE AUTH ---
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || 'ALUNO' }
    });
    res.json({ message: 'Usuário criado com sucesso', id: user.id });
  } catch (err) {
    res.status(400).json({ error: 'Email já cadastrado' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { name: user.name, role: user.role, id: user.id } });
});

// --- ROTA DE LISTAGEM DE TREINOS (ALUNO) ---

app.get('/workouts/student', authenticate, async (req: any, res) => {
  const workouts = await prisma.workout.findMany({
    where: { studentId: req.user.id },
    include: {
      coach: { select: { name: true } },
      exercises: {
        include: { exercise: true }
      }
    }
  });
  res.json(workouts);
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`🚀 Fitness Tech API running on port ${PORT}`));
