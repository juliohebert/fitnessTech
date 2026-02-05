import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedBadges() {
  console.log('🏅 Populando badges...\n');

  const badges = [
    {
      nome: 'Primeiro Treino',
      descricao: 'Complete seu primeiro treino',
      icone: 'Star',
      tipo: 'TREINO',
      criterio: 'Completar 1 treino',
      valor: 1
    },
    {
      nome: 'Sequência de 7 dias',
      descricao: 'Treinar 7 dias consecutivos',
      icone: 'Flame',
      tipo: 'SEQUENCIA',
      criterio: 'Treinar 7 dias seguidos',
      valor: 7
    },
    {
      nome: 'Levantador de Peso',
      descricao: 'Levante mais de 100kg',
      icone: 'Zap',
      tipo: 'PESO',
      criterio: 'Levantar 100kg ou mais',
      valor: 100
    },
    {
      nome: 'Cardio Master',
      descricao: 'Complete 50 sessões de cardio',
      icone: 'Heart',
      tipo: 'CARDIO',
      criterio: 'Completar 50 treinos de cardio',
      valor: 50
    },
    {
      nome: 'Transformação',
      descricao: 'Perca 10kg',
      icone: 'TrendingDown',
      tipo: 'PESO',
      criterio: 'Perder 10kg',
      valor: 10
    },
    {
      nome: 'Maratonista',
      descricao: 'Corra 42km em uma sessão',
      icone: 'Target',
      tipo: 'CARDIO',
      criterio: 'Correr 42km',
      valor: 42
    }
  ];

  for (const badge of badges) {
    const existente = await prisma.badge.findFirst({
      where: { nome: badge.nome }
    });

    if (!existente) {
      await prisma.badge.create({ data: badge });
      console.log(`✅ Badge criado: ${badge.nome}`);
    } else {
      console.log(`⏭️  Badge já existe: ${badge.nome}`);
    }
  }

  console.log('\n✨ Badges populados com sucesso!\n');
}

seedBadges()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
