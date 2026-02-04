import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function criarAlunosTeste() {
  try {
    // Buscar a primeira academia
    const academia = await prisma.academia.findFirst();
    
    if (!academia) {
      console.error('❌ Nenhuma academia encontrada');
      return;
    }

    console.log(`🏢 Usando academia: ${academia.nome}`);

    // Criar alunos de teste
    const alunosTeste = [
      {
        nome: 'João Silva',
        email: 'joao@email.com',
        cpf: '111.111.111-11',
        telefone: '(11) 98888-8888',
        funcao: 'ALUNO',
      },
      {
        nome: 'Maria Santos',
        email: 'maria@email.com',
        cpf: '222.222.222-22',
        telefone: '(11) 97777-7777',
        funcao: 'ALUNO',
      },
      {
        nome: 'Pedro Costa',
        email: 'pedro@email.com',
        cpf: '333.333.333-33',
        telefone: '(11) 96666-6666',
        funcao: 'ALUNO',
      },
      {
        nome: 'Ana Oliveira',
        email: 'ana@email.com',
        cpf: '444.444.444-44',
        telefone: '(11) 95555-5555',
        funcao: 'ALUNO',
      },
    ];

    const senhaHash = await bcrypt.hash('123456', 10);

    for (const alunoData of alunosTeste) {
      const alunoExistente = await prisma.usuario.findUnique({
        where: { email: alunoData.email }
      });

      if (alunoExistente) {
        console.log(`⚠️  Aluno ${alunoData.nome} já existe`);
        continue;
      }

      const aluno = await prisma.usuario.create({
        data: {
          ...alunoData,
          senha: senhaHash,
          academiaId: academia.id,
          ativo: true,
        }
      });

      console.log(`✅ Aluno criado: ${aluno.nome} (${aluno.email})`);
    }

    console.log('\n🎉 Alunos de teste criados com sucesso!');
    console.log('📝 Senha padrão para todos: 123456');

  } catch (error) {
    console.error('❌ Erro ao criar alunos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

criarAlunosTeste();
