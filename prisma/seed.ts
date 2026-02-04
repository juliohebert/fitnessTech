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

  // Criar usuários de teste para todas as funções
  const senhaHash = await bcrypt.hash('123456', 10);
  
  const usuarioAluno = await prisma.usuario.create({
    data: {
      email: 'aluno@fitness.com',
      senha: senhaHash,
      nome: 'João Aluno',
      funcao: 'ALUNO',
      plano: 'pro',
      academiaId: academia.id,
      telefone: '(11) 98765-4321',
      cpf: '123.456.789-00'
    }
  });

  const usuarioAdmin = await prisma.usuario.create({
    data: {
      email: 'admin@fitness.com',
      senha: senhaHash,
      nome: 'Carlos Admin',
      funcao: 'ADMIN',
      plano: 'pro',
      academiaId: academia.id,
      telefone: '(11) 98765-4322',
      cpf: '123.456.789-01'
    }
  });

  const usuarioNutri = await prisma.usuario.create({
    data: {
      email: 'nutri@fitness.com',
      senha: senhaHash,
      nome: 'Ana Nutricionista',
      funcao: 'NUTRI',
      plano: 'pro',
      academiaId: academia.id,
      telefone: '(11) 98765-4323',
      cpf: '123.456.789-02'
    }
  });

  const usuarioProfessor = await prisma.usuario.create({
    data: {
      email: 'professor@fitness.com',
      senha: senhaHash,
      nome: 'Pedro Professor',
      funcao: 'PROFESSOR',
      plano: 'pro',
      academiaId: academia.id,
      telefone: '(11) 98765-4324',
      cpf: '123.456.789-03'
    }
  });

  console.log('✅ Usuários criados:');
  console.log('   👨‍💼 Admin:', usuarioAdmin.email, '- Senha: 123456');
  console.log('   🥗 Nutricionista:', usuarioNutri.email, '- Senha: 123456');
  console.log('   🏋️ Professor:', usuarioProfessor.email, '- Senha: 123456');
  console.log('   👤 Aluno:', usuarioAluno.email, '- Senha: 123456');

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
      usuarioId: usuarioAluno.id,
      titulo: 'Primeira Semana',
      descricao: 'Completou 7 dias consecutivos de treino',
      icone: 'flame',
      categoria: 'treino'
    },
    {
      usuarioId: usuarioAluno.id,
      titulo: '100 Treinos',
      descricao: 'Atingiu a marca de 100 treinos realizados',
      icone: 'trophy',
      categoria: 'progresso'
    },
    {
      usuarioId: usuarioAluno.id,
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
      usuarioId: usuarioAluno.id,
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
      usuarioId: usuarioAluno.id,
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
      usuarioId: usuarioAluno.id,
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
      usuarioId: usuarioAluno.id,
      conteudo: 'Acabei de completar meu melhor treino! 💪 #FitnessTech',
      curtidas: 127,
      comentarios: 34
    }
  });

  await prisma.postagem.create({
    data: {
      usuarioId: usuarioAluno.id,
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
      usuarioId: usuarioAluno.id,
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
      usuarioId: usuarioAluno.id,
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
      usuarioId: usuarioAluno.id,
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
      usuarioId: usuarioAluno.id,
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
      usuarioId: usuarioAluno.id,
      titulo: 'Nova Conquista Desbloqueada!',
      mensagem: 'Você ganhou o badge "Primeira Semana"',
      tipo: 'conquista'
    }
  });

  await prisma.notificacao.create({
    data: {
      usuarioId: usuarioAluno.id,
      titulo: 'Hora do Treino!',
      mensagem: 'Não se esqueça do seu treino de pernas hoje',
      tipo: 'info'
    }
  });

  console.log('✅ Notificações criadas: 2');

  // ===== DADOS DO MÓDULO ADMINISTRATIVO =====
  
  // Limpar dados do módulo administrativo
  await prisma.registroAcesso.deleteMany({ where: { academiaId: academia.id } });
  await prisma.relatorioFinanceiro.deleteMany({ where: { academiaId: academia.id } });
  await prisma.funcionario.deleteMany({ where: { academiaId: academia.id } });
  await prisma.produto.deleteMany({ where: { academiaId: academia.id } });
  await prisma.ticketManutencao.deleteMany({ where: { academiaId: academia.id } });
  await prisma.lead.deleteMany({ where: { academiaId: academia.id } });

  console.log('🏢 Criando dados do módulo administrativo...');

  // Criar Leads (CRM)
  const leads = [
    {
      academiaId: academia.id,
      nome: 'Maria Silva',
      telefone: '(11) 99999-0001',
      email: 'maria@email.com',
      origem: 'Instagram',
      valorEstimado: 'R$ 150/mês',
      status: 'lead',
      observacoes: 'Interessada em musculação'
    },
    {
      academiaId: academia.id,
      nome: 'João Santos',
      telefone: '(11) 99999-0002',
      email: 'joao@email.com',
      origem: 'Facebook',
      valorEstimado: 'R$ 180/mês',
      status: 'trial',
      observacoes: 'Quer perder peso'
    },
    {
      academiaId: academia.id,
      nome: 'Ana Costa',
      telefone: '(11) 99999-0003', 
      email: 'ana@email.com',
      origem: 'Indicação',
      valorEstimado: 'R$ 200/mês',
      status: 'converted',
      observacoes: 'Ex-atleta, precisa de acompanhamento personalizado'
    }
  ];

  for (const lead of leads) {
    await prisma.lead.create({ data: lead });
  }
  console.log('📊 Leads criados: 3');

  // Criar Tickets de Manutenção
  const tickets = [
    {
      academiaId: academia.id,
      equipamento: 'Esteira 01',
      descricao: 'Motor fazendo ruído excessivo',
      prioridade: 'HIGH',
      status: 'OPEN',
      criadoPor: usuarioAdmin.id
    },
    {
      academiaId: academia.id,
      equipamento: 'Leg Press',
      descricao: 'Cabo do peso rompido',
      prioridade: 'MEDIUM',
      status: 'IN_PROGRESS',
      criadoPor: usuarioAdmin.id
    },
    {
      academiaId: academia.id,
      equipamento: 'Ar Condicionado',
      descricao: 'Não está resfriando adequadamente',
      prioridade: 'LOW',
      status: 'FIXED',
      criadoPor: usuarioAdmin.id,
      resolvido: new Date('2025-01-15T10:30:00')
    }
  ];

  for (const ticket of tickets) {
    await prisma.ticketManutencao.create({ data: ticket });
  }
  console.log('🔧 Tickets de manutenção criados: 3');

  // Criar Produtos
  const produtos = [
    {
      academiaId: academia.id,
      nome: 'Whey Protein 1kg',
      categoria: 'Suplementos',
      preco: 89.90,
      estoque: 25,
      estoqueMinimo: 5,
      descricao: 'Proteína isolada de alta qualidade',
      urlImagem: '/images/whey.jpg'
    },
    {
      academiaId: academia.id,
      nome: 'Creatina 300g',
      categoria: 'Suplementos',
      preco: 45.50,
      estoque: 30,
      estoqueMinimo: 10,
      descricao: 'Creatina monoidratada pura',
      urlImagem: '/images/creatina.jpg'
    },
    {
      academiaId: academia.id,
      nome: 'Camiseta FitnessTech',
      categoria: 'Vestuário',
      preco: 39.90,
      estoque: 50,
      estoqueMinimo: 15,
      descricao: 'Camiseta dry-fit com logo da academia',
      urlImagem: '/images/camiseta.jpg'
    },
    {
      academiaId: academia.id,
      nome: 'Garrafa Squeeze 750ml',
      categoria: 'Acessórios',
      preco: 25.00,
      estoque: 40,
      estoqueMinimo: 20,
      descricao: 'Garrafa esportiva com logo personalizado',
      urlImagem: '/images/squeeze.jpg'
    }
  ];

  for (const produto of produtos) {
    await prisma.produto.create({ data: produto });
  }
  console.log('📦 Produtos criados: 4');

  // Criar Funcionários
  const funcionarios = [
    {
      academiaId: academia.id,
      nome: 'Carlos Silva',
      cargo: 'Personal Trainer',
      salario: 3500.00,
      telefone: '(11) 98888-0001',
      email: 'carlos@academia.com',
      dataAdmissao: new Date('2024-01-15')
    },
    {
      academiaId: academia.id,
      nome: 'Ana Nutritionist',
      cargo: 'Nutricionista',
      salario: 4000.00,
      telefone: '(11) 98888-0002', 
      email: 'ana.nutri@academia.com',
      dataAdmissao: new Date('2024-03-01')
    },
    {
      academiaId: academia.id,
      nome: 'João Recepcionista',
      cargo: 'Atendente',
      salario: 2200.00,
      telefone: '(11) 98888-0003',
      email: 'joao@academia.com',
      dataAdmissao: new Date('2024-06-10')
    }
  ];

  for (const funcionario of funcionarios) {
    await prisma.funcionario.create({ data: funcionario });
  }
  console.log('👥 Funcionários criados: 3');

  // Criar Relatórios Financeiros
  const relatoriosFinanceiros = [
    {
      academiaId: academia.id,
      mes: 12,
      ano: 2024,
      receita: 45000.00,
      despesas: 28000.00,
      lucro: 17000.00,
      inadimplencia: 2500.00
    },
    {
      academiaId: academia.id,
      mes: 11,
      ano: 2024,
      receita: 42000.00,
      despesas: 26000.00,
      lucro: 16000.00,
      inadimplencia: 2200.00
    },
    {
      academiaId: academia.id,
      mes: 10,
      ano: 2024,
      receita: 38000.00,
      despesas: 24000.00,
      lucro: 14000.00,
      inadimplencia: 1800.00
    }
  ];

  for (const relatorio of relatoriosFinanceiros) {
    await prisma.relatorioFinanceiro.create({ data: relatorio });
  }
  console.log('💰 Relatórios financeiros criados: 3');

  // Criar Registros de Acesso (hoje)
  const hoje = new Date();
  const registrosAcesso = [
    {
      academiaId: academia.id,
      nomeAluno: 'Pedro Costa',
      data: hoje,
      hora: '06:30'
    },
    {
      academiaId: academia.id,
      nomeAluno: 'Maria Santos',
      data: hoje,
      hora: '07:15'
    },
    {
      academiaId: academia.id,
      nomeAluno: 'Carlos Silva',
      data: hoje,
      hora: '08:00'
    },
    {
      academiaId: academia.id,
      nomeAluno: 'Ana Oliveira',
      data: hoje,
      hora: '09:30'
    }
  ];

  for (const registro of registrosAcesso) {
    await prisma.registroAcesso.create({ data: registro });
  }
  console.log('🚪 Registros de acesso criados: 4');

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
