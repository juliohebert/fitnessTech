import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_T6G3YvsxAhbq@ep-gentle-field-ac10d3ig-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function testLogin(email, senha) {
  console.log('\n🔐 Testando:', email);
  
  const usuario = await prisma.usuario.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { academia: true }
  });
  
  if (!usuario) {
    console.log('❌ Usuário não encontrado');
    return false;
  }
  
  console.log('✅ Usuário encontrado:', usuario.nome);
  console.log('📧 Email no banco:', usuario.email);
  console.log('🔑 Hash:', usuario.senha.substring(0, 30) + '...');
  
  const senhaOk = await bcrypt.compare(senha, usuario.senha);
  console.log('🔐 Senha OK:', senhaOk ? '✅ SIM' : '❌ NÃO');
  
  return senhaOk;
}

(async () => {
  await testLogin('admin@fitness.com', '123456');
  await testLogin('professor@fitness.com', '123456');
  await testLogin('nutri@fitness.com', '123456');
  await testLogin('aluno@fitness.com', '123456');
  await prisma.$disconnect();
})();
