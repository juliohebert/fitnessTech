# 🔧 Correção: Dietas Não Aparecendo para Alunos

## 📋 Problema Identificado

As dietas geradas pelo admin ou nutricionista não estavam aparecendo para os alunos. O problema tinha duas causas principais:

### 1. Inconsistência no Modelo de Dados

- O **schema do Prisma** não possuía um modelo `HistoricoDieta`
- O arquivo [api/index.js](api/index.js) (usado em produção no Vercel) estava tentando usar `prisma.historicoDieta` que não existia
- O arquivo [src/server.ts](src/server.ts) (desenvolvimento) estava usando corretamente `prisma.relatorio` com `tipo: 'dieta'`

### 2. Formatação Incorreta dos Dados no Frontend

- As dietas são armazenadas na tabela `Relatorio` com a estrutura:
  ```json
  {
    "tipo": "dieta",
    "dados": {
      "titulo": "...",
      "refeicoes": {...},
      "observacoes": "..."
    }
  }
  ```
- O frontend estava tentando acessar `dieta.plano` ou `dieta.conteudo`, mas os dados estavam em `dieta.dados`

## ✅ Soluções Implementadas

### 1. Corrigido api/index.js (Produção Vercel)

#### GET /api/historico-dietas
```javascript
// ANTES: Usava prisma.historicoDieta (não existe)
const historico = await prisma.historicoDieta.findMany({
  where: { usuarioId: targetUserId },
  orderBy: { data: 'desc' }
});

// DEPOIS: Usa prisma.relatorio com tipo 'dieta'
const historico = await prisma.relatorio.findMany({
  where: { 
    usuarioId: targetUserId,
    tipo: 'dieta'
  },
  orderBy: { criadoEm: 'desc' }
});
```

#### POST /api/historico-dietas
```javascript
// ANTES: Tentava criar em historicoDieta
const historico = await prisma.historicoDieta.create({
  data: {
    usuarioId: targetUserId,
    titulo: titulo.trim(),
    plano: plano || {}
  }
});

// DEPOIS: Cria em relatorio com estrutura correta
const historico = await prisma.relatorio.create({
  data: {
    usuarioId: targetUserId,
    tipo: 'dieta',
    periodo: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    dados: {
      titulo: titulo.trim(),
      objetivo,
      refeicoes: refeicoes || plano,
      observacoes,
      origem: origem || 'Manual'
    }
  }
});
```

#### PUT /api/historico-dietas/:id
```javascript
// ANTES: Atualizava campos diretamente
const dietaAtualizada = await prisma.historicoDieta.update({
  where: { id: dietaId },
  data: dadosAtualizacao
});

// DEPOIS: Atualiza dentro do campo 'dados'
const dadosAtualizados = {
  ...(dietaExistente.dados || {}),
  ...(titulo && { titulo: titulo.trim() }),
  ...(objetivo && { objetivo }),
  ...(refeicoes && { refeicoes }),
  ...(plano && { refeicoes: plano }),
  ...(observacoes !== undefined && { observacoes })
};

const dietaAtualizada = await prisma.relatorio.update({
  where: { id: dietaId },
  data: { dados: dadosAtualizados }
});
```

#### DELETE /api/historico-dietas/:id (ADICIONADO)
```javascript
// Rota DELETE não existia, foi adicionada
if (method === 'DELETE' && url?.match(/\/historico-dietas\/([^\/]+)$/)) {
  // Verifica se é relatorio com tipo 'dieta'
  // Verifica permissões
  // Remove a dieta
}
```

### 2. Corrigido App.tsx - Módulo do Aluno

#### Formatação das Dietas (StudentModule)
```typescript
// ANTES: Não formatava, apenas setava diretamente
setHistoricoDietas(dietas);

// DEPOIS: Formata corretamente extraindo dados.refeicoes
const dietasFormatadas = Array.isArray(dietas) ? dietas.map((dieta: any) => {
  // As dietas vêm da tabela Relatorio com estrutura: dados: { titulo, refeicoes, ... }
  const plano = dieta.dados?.refeicoes || dieta.conteudo?.refeicoes || {};
  return {
    id: dieta.id,
    titulo: dieta.dados?.titulo || dieta.titulo || 'Dieta',
    alunoId: dieta.usuarioId,
    alunoNome: 'Aluno',
    data: new Date(dieta.criadoEm).toLocaleDateString('pt-BR'),
    plano: plano,
    tipo: (dieta.dados?.origem || dieta.conteudo?.origem) === 'IA' ? 'ia' : 'manual'
  };
}) : [];
setHistoricoDietas(dietasFormatadas);
```

### 3. Corrigido App.tsx - Módulo do Nutricionista

#### Formatação das Dietas (NutritionistModule)
```typescript
// ANTES: Tentava acessar conteudo.refeicoes
const dietasFormatadas = dietas.map((dieta: any) => ({
  id: dieta.id,
  titulo: dieta.titulo,
  plano: typeof dieta.conteudo === 'object' ? dieta.conteudo.refeicoes : JSON.parse(dieta.conteudo || '{}')
}));

// DEPOIS: Acessa dados.refeicoes corretamente
const dietasFormatadas = dietas.map((dieta: any) => {
  const plano = dieta.dados?.refeicoes || dieta.conteudo?.refeicoes || {};
  return {
    id: dieta.id,
    titulo: dieta.dados?.titulo || dieta.titulo || 'Dieta',
    alunoId: selectedStudent.id,
    plano: plano
  };
});
```

## 🎯 Resultado

Agora as dietas:
1. ✅ São salvas corretamente na tabela `Relatorio` com `tipo: 'dieta'`
2. ✅ São recuperadas corretamente tanto em desenvolvimento quanto em produção
3. ✅ São formatadas corretamente para exibição no frontend
4. ✅ Aparecem para os alunos quando prescritas por admin ou nutricionista
5. ✅ Podem ser editadas e removidas com as permissões corretas

## 🚀 Deploy

Para que as alterações tenham efeito em produção:
```bash
git add .
git commit -m "fix: Corrigir exibição de dietas para alunos"
git push
```

O Vercel irá fazer deploy automaticamente usando o [api/index.js](api/index.js) corrigido.

## 📝 Observações

- A tabela `Relatorio` é usada para armazenar tanto treinos quanto dietas
- O campo `tipo` diferencia: `'treino'` ou `'dieta'`
- Os dados específicos ficam no campo JSON `dados`
- Esta abordagem está alinhada entre desenvolvimento (src/server.ts) e produção (api/index.js)
