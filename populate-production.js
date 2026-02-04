import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_FafQ98jdxohV@ep-green-sun-ac2ra02f-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function main() {
  console.log('🗑️  Limpando usuários antigos...');
  await prisma.usuario.deleteMany();
  
  console.log('🔐 Criando hash de senha...');
  const senhaHash = await bcrypt.hash('123456', 10);
  
  console.log('👥 Criando usuários...');
  
  const academia = await prisma.academia.upsert({
    where: { id: 'cml8bkip20000135hc9tin8v4' },
    create: {
      id: 'cml8bkip20000135hc9tin8v4',
      nome: 'FitnessTech Academy',
      plano: 'pro',
      maxUsuarios: 100,
      usuariosAtuais: 4
    },
    update: {}
  });
  
  const usuarios = [
    { email: 'admin@fitness.com', nome: 'Admin Sistema', funcao: 'ADMIN' },
    { email: 'professor@fitness.com', nome: 'Professor Teste', funcao: 'PROFESSOR' },
    { email: 'nutri@fitness.com', nome: 'Nutricionista Teste', funcao: 'NUTRI' },
    { email: 'aluno@fitness.com', nome: 'Aluno Teste', funcao: 'ALUNO' }
  ];
  
  for (const u of usuarios) {
    const created = await prisma.usuario.create({
      data: {
        email: u.email,
        nome: u.nome,
        senha: senhaHash,
        funcao: u.funcao,
        plano: 'pro',
        academiaId: academia.id
      }
    });
    console.log('✅', created.email);
  }
  
  console.log('\n🎉 Concluído! Todos usuários com senha: 123456');
  await prisma.$disconnect();
}

main();
