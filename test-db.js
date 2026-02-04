import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_T6G3YvsxAhbq@ep-gentle-field-ac10d3ig-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function test() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { email: true, nome: true, funcao: true }
    });
    console.log('✅ Usuários no banco de produção:', usuarios);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
