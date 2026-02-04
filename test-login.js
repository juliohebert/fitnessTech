import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_T6G3YvsxAhbq@ep-gentle-field-ac10d3ig-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function test() {
  const emails = ['admin@fitness.com', 'professor@fitness.com', 'nutri@fitness.com', 'aluno@fitness.com'];
  
  for (const email of emails) {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (usuario) {
      const senhaOk = await bcrypt.compare('123456', usuario.senha);
      console.log(`${email}: ${senhaOk ? '✅' : '❌'} (hash: ${usuario.senha.substring(0, 20)}...)`);
    } else {
      console.log(`${email}: ❌ NÃO EXISTE`);
    }
  }
  
  await prisma.$disconnect();
}

test();
