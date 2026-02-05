import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function limparGrupos() {
  try {
    console.log('🗑️  Limpando grupos de teste...\n');
    
    const grupos = await prisma.grupo.findMany({
      select: {
        id: true,
        nome: true,
        totalMembros: true,
        criadoEm: true
      },
      orderBy: { criadoEm: 'desc' }
    });
    
    console.log('📋 Grupos encontrados:', grupos.length);
    grupos.forEach((g, i) => {
      console.log(`  ${i + 1}. ${g.nome} (${g.totalMembros} membros)`);
    });
    
    const gruposDeTeste = grupos.filter(g => 
      g.nome.toLowerCase().includes('desafio') ||
      g.nome.toLowerCase().includes('yoga') ||
      g.nome.toLowerCase().includes('corrida') ||
      g.nome.toLowerCase().includes('hipertrofia')
    );
    
    if (gruposDeTeste.length === 0) {
      console.log('\n✅ Nenhum grupo de teste encontrado!');
      return;
    }
    
    console.log(`\n⚠️  Encontrados ${gruposDeTeste.length} grupos de teste:`);
    gruposDeTeste.forEach(g => console.log(`   - ${g.nome}`));
    
    console.log('\n🗑️  Deletando...');
    for (const grupo of gruposDeTeste) {
      await prisma.membroGrupo.deleteMany({
        where: { grupoId: grupo.id }
      });
      
      await prisma.grupo.delete({
        where: { id: grupo.id }
      });
      
      console.log(`✅ ${grupo.nome}`);
    }
    
    console.log(`\n✨ Concluído! ${gruposDeTeste.length} grupos removidos.\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

limparGrupos();
