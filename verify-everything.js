import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const VERCEL_DB = "postgresql://neondb_owner:npg_T6G3YvsxAhbq@ep-gentle-field-ac10d3ig-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";

console.log('🔍 VERIFICAÇÃO COMPLETA DO SISTEMA\n');
console.log('📌 Database URL (Vercel):', VERCEL_DB.split('@')[1].split('/')[0]);

const prisma = new PrismaClient({ datasources: { db: { url: VERCEL_DB } } });

async function verify() {
  try {
    // 1. Verificar conexão
    console.log('\n1️⃣ TESTANDO CONEXÃO...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida\n');
    
    // 2. Listar todos usuários
    console.log('2️⃣ USUÁRIOS NO BANCO:');
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, email: true, nome: true, funcao: true, senha: true }
    });
    
    if (usuarios.length === 0) {
      console.log('❌ NENHUM USUÁRIO NO BANCO!');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`✅ Total: ${usuarios.length} usuários\n`);
    
    // 3. Testar bcrypt para cada um
    console.log('3️⃣ TESTE DE LOGIN (senha: 123456):');
    for (const user of usuarios) {
      const senhaOk = await bcrypt.compare('123456', user.senha);
      const status = senhaOk ? '✅' : '❌';
      console.log(`${status} ${user.email.padEnd(30)} | ${user.nome.padEnd(20)} | ${user.funcao}`);
      if (!senhaOk) {
        console.log(`   ⚠️  Hash: ${user.senha.substring(0, 40)}...`);
      }
    }
    
    // 4. Testar query exata que a API usa
    console.log('\n4️⃣ SIMULANDO API (professor@fitness.com):');
    const usuario = await prisma.usuario.findUnique({
      where: { email: 'professor@fitness.com' },
      include: { academia: true }
    });
    
    if (!usuario) {
      console.log('❌ Usuário não encontrado com findUnique');
    } else {
      console.log('✅ Usuário encontrado:', usuario.nome);
      const senhaOk = await bcrypt.compare('123456', usuario.senha);
      console.log('🔑 Senha válida:', senhaOk ? '✅ SIM' : '❌ NÃO');
      console.log('🏢 Academia:', usuario.academia ? usuario.academia.nome : 'null');
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
