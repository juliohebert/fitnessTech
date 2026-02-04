import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando banco de dados...');

  // Limpar dados existentes
  await prisma.itemCarrinho.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.relatorio.deleteMany();
  await prisma.analiseRecuperacao.deleteMany();
  await prisma.previsaoIA.deleteMany();
  await prisma.membroGrupo.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.postagem.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.desafio.deleteMany();
  await prisma.conquista.deleteMany();
  await prisma.meta.deleteMany();
  await prisma.medicaoCorporal.deleteMany();
  await prisma.fotoProgresso.deleteMany();
  await prisma.anotacaoTreino.deleteMany();
  await prisma.historicoTreino.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.academia.deleteMany();

  // Criar Academia
  const academia = await prisma.academia.create({
    data: {
      nome: 'FitnessTech Academy',
      plano: 'pro',
      maxUsuarios: 100,
      usuariosAtuais: 1
    }
  });

  // Criar usuário de teste
  const senhaHash = await bcrypt.hash('123456', 10);
  const usuario = await prisma.usuario.create({
    data: {
      email: 'teste@fitness.com',
      senha: senhaHash,
      nome: 'Usuário Teste',
      funcao: 'ALUNO',
      plano: 'pro',
      academiaId: academia.id,
      telefone: '(11) 98765-4321',
      cpf: '123.456.789-00'
    }
  });

  console.log('✅ Usuário criado:', usuario.email);

  // Criar grupos de exemplo
  const grupos = [
    {
      nome: 'Hipertrofia Extrema',
      descricao: 'Para quem busca ganhar massa muscular de forma intensa',
      categoria: 'Musculação',
      totalMembros: 1247,
      imagem: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48'
    },
    {
      nome: 'Corrida e Cardio',
      descricao: 'Amantes de corrida e exercícios aeróbicos',
      categoria: 'Cardio',
      totalMembros: 856,
      imagem: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5'
    },
    {
      nome: 'Yoga & Meditação',
      descricao: 'Práticas de yoga e mindfulness',
      categoria: 'Bem-estar',
      totalMembros: 643,
      imagem: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b'
    },
    {
      nome: 'Desafio 30 Dias',
      descricao: 'Transforme seu corpo em apenas 30 dias',
      categoria: 'Desafios',
      totalMembros: 2156,
      imagem: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b'
    }
  ];

  for (const grupo of grupos) {
    await prisma.grupo.create({
      data: grupo
    });
  }

  console.log('✅ Grupos criados:', grupos.length);

  // Criar conquistas de exemplo
  const conquistas = [
    {
      usuarioId: usuario.id,
      titulo: 'Primeira Semana',
      descricao: 'Completou 7 dias consecutivos de treino',
      icone: 'flame',
      categoria: 'treino'
    },
    {
      usuarioId: usuario.id,
      titulo: '100 Treinos',
      descricao: 'Atingiu a marca de 100 treinos realizados',
      icone: 'trophy',
      categoria: 'progresso'
    },
    {
      usuarioId: usuario.id,
      titulo: 'Madrugador',
      descricao: 'Treinou antes das 7h da manhã',
      icone: 'sun',
      categoria: 'desafio'
    }
  ];

  for (const conquista of conquistas) {
    await prisma.conquista.create({
      data: conquista
    });
  }

  console.log('✅ Conquistas criadas:', conquistas.length);

  // Criar metas de exemplo
  await prisma.meta.create({
    data: {
      usuarioId: usuario.id,
      titulo: 'Perder 5kg',
      descricao: 'Meta de emagrecimento',
      valorAlvo: 5,
      valorAtual: 2.5,
      unidade: 'kg',
      prazo: new Date('2024-12-31')
    }
  });

  await prisma.meta.create({
    data: {
      usuarioId: usuario.id,
      titulo: '50 Treinos no Mês',
      descricao: 'Completar 50 treinos em 30 dias',
      valorAlvo: 50,
      valorAtual: 23,
      unidade: 'treinos'
    }
  });

  console.log('✅ Metas criadas: 2');

  // Criar ranking
  await prisma.ranking.create({
    data: {
      usuarioId: usuario.id,
      pontos: 1250,
      nivel: 5,
      sequencia: 7,
      posicao: 42
    }
  });

  console.log('✅ Ranking criado');

  // Criar postagens sociais
  await prisma.postagem.create({
    data: {
      usuarioId: usuario.id,
      conteudo: 'Acabei de completar meu melhor treino! 💪 #FitnessTech',
      curtidas: 127,
      comentarios: 34
    }
  });

  await prisma.postagem.create({
    data: {
      usuarioId: usuario.id,
      conteudo: 'Novo recorde pessoal: 100kg no supino! 🏋️',
      urlImagem: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e',
      curtidas: 89,
      comentarios: 21
    }
  });

  console.log('✅ Postagens criadas: 2');

  // Criar histórico de treinos
  await prisma.historicoTreino.create({
    data: {
      usuarioId: usuario.id,
      tituloTreino: 'Treino de Peito e Tríceps',
      exercicios: [
        { nome: 'Supino Reto', series: 4, repeticoes: 10, peso: 80 },
        { nome: 'Supino Inclinado', series: 4, repeticoes: 12, peso: 60 },
        { nome: 'Crucifixo', series: 3, repeticoes: 15, peso: 20 },
        { nome: 'Tríceps Testa', series: 4, repeticoes: 12, peso: 30 }
      ],
      duracao: 65,
      calorias: 420
    }
  });

  console.log('✅ Histórico de treino criado');

  // Criar medições corporais
  await prisma.medicaoCorporal.create({
    data: {
      usuarioId: usuario.id,
      peso: 82.5,
      altura: 1.78,
      imc: 26.1,
      gorduraCorporal: 18.5,
      massaMuscular: 42.3,
      peito: 105,
      cintura: 88,
      quadril: 98,
      biceps: 38,
      coxa: 58,
      panturrilha: 38
    }
  });

  console.log('✅ Medição corporal criada');

  // Criar previsão de IA
  await prisma.previsaoIA.create({
    data: {
      usuarioId: usuario.id,
      tipo: 'desempenho',
      previsao: {
        metrica: 'Força no Supino',
        valorAtual: 80,
        previsao30dias: 88,
        previsao60dias: 95,
        confianca: 0.85
      },
      confianca: 0.85
    }
  });

  console.log('✅ Previsão de IA criada');

  // Criar análise de recuperação
  await prisma.analiseRecuperacao.create({
    data: {
      usuarioId: usuario.id,
      horasSono: 7.5,
      nivelEstresse: 4,
      doresMuscular: 3,
      prontidao: 'boa',
      recomendacoes: {
        treino: 'moderado',
        descanso: 'Descanse bem hoje à noite',
        hidratacao: 'Beba pelo menos 2.5L de água'
      }
    }
  });

  console.log('✅ Análise de recuperação criada');

  // Criar notificações
  await prisma.notificacao.create({
    data: {
      usuarioId: usuario.id,
      titulo: 'Nova Conquista Desbloqueada!',
      mensagem: 'Você ganhou o badge "Primeira Semana"',
      tipo: 'conquista'
    }
  });

  await prisma.notificacao.create({
    data: {
      usuarioId: usuario.id,
      titulo: 'Hora do Treino!',
      mensagem: 'Não se esqueça do seu treino de pernas hoje',
      tipo: 'info'
    }
  });

  console.log('✅ Notificações criadas: 2');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📧 Login de teste:');
  console.log('   Email: teste@fitness.com');
  console.log('   Senha: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao popular banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
