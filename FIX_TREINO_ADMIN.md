# 🔧 Correção: Salvamento e Exibição de Treinos Prescritos

## Problema Identificado

Quando um **ADMIN** prescrevia um treino para um aluno através do módulo administrativo, o treino era inserido apenas no **estado local** (React state), mas **não estava sendo persistido no banco de dados**. Isso causava dois problemas:

1. ❌ O treino não ficava salvo após reload da página
2. ❌ O aluno não conseguia ver o treino prescrito

## Solução Implementada

### 1. Salvamento no Banco de Dados
**Arquivo**: `App.tsx` (linha ~5750)

**Antes:**
```tsx
onClick={() => {
  const novoTreino = {
    id: Date.now(),
    titulo: planoTreino.titulo,
    // ... dados locais
  };
  setHistoricoTreinos(prev => [novoTreino, ...prev]); // ❌ Apenas estado local
  alert('Treino prescrito com sucesso!');
}}
```

**Depois:**
```tsx
onClick={async () => {
  try {
    const token = localStorage.getItem('fitness_token');
    if (token) {
      const dadosTreino = {
        usuarioId: selectedStudent.id, // ✅ ID do aluno
        titulo: planoTreino.titulo,
        tipoTreino: 'Treino Personalizado Manual',
        duracao: 60,
        exercicios: planoAtualizado,
        observacoes: 'Treino prescrito manualmente pelo instrutor',
        origem: 'Manual'
      };
      
      const treinoSalvo = await salvarTreino(token, dadosTreino); // ✅ Salva no banco
      
      if (treinoSalvo) {
        const novoTreino = {
          id: treinoSalvo.id,
          titulo: treinoSalvo.tituloTreino || treinoSalvo.titulo,
          alunoId: selectedStudent.id,
          alunoNome: selectedStudent.nome,
          data: new Date(treinoSalvo.data).toLocaleDateString('pt-BR'),
          plano: treinoSalvo.exercicios || planoAtualizado,
          tipo: 'manual'
        };
        setHistoricoTreinos(prev => [novoTreino, ...prev]);
        alert('Treino prescrito e salvo com sucesso!');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao salvar treino:', error);
    alert('Erro ao salvar treino no banco de dados');
  }
}}
```

### 2. Exibição do Treino para o Aluno
**Arquivo**: `App.tsx` (linha ~2335)

**Problema:** O código buscava treinos pela **data exata** (hoje), mas os treinos prescritos devem ser mostrados por **dia da semana**.

**Antes:**
```tsx
const treinoHoje = historicoTreinos.find(t => {
  const dataHistorico = new Date(t.data);
  return dataHistorico.toDateString() === hoje.toDateString(); // ❌ Compara datas
});
```

**Depois:**
```tsx
// ✅ Busca pelo dia da semana atual
const diasSemanaArray = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const diaAtualNome = diasSemanaArray[hoje.getDay()];

const treinoHoje = historicoTreinos.find(t => {
  return t.plano && t.plano[diaAtualNome] && t.plano[diaAtualNome].length > 0;
});

const todayWorkout = treinoHoje ? {
  title: treinoHoje.titulo || 'Treino do Dia',
  category: treinoHoje.tipo === 'ia' ? 'IA' : 'Manual',
  duration: '60 min',
  exercises: (treinoHoje.plano[diaAtualNome] || []).map((ex: any) => ({
    n: ex.nome,
    s: ex.series,
    r: ex.repeticoes,
    w: ex.carga,
    rest: ex.descanso || '60'
  }))
} : { /* treino vazio */ };
```

## Fluxo Completo

### 1. ADMIN prescreve treino
```
Admin Dashboard
  → Seleciona aluno "Julio Hebert"
  → Clica em "Prescrever Treino"
  → Preenche plano de treino
  → Clica "Salvar Plano de Treino"
```

### 2. Sistema salva no banco
```
Frontend (App.tsx)
  → Monta dados do treino
  → Chama salvarTreino() com token
  
API (server.ts)
  → POST /api/historico-treinos
  → Salva no Prisma com usuarioId do aluno
  → Retorna treino salvo
```

### 3. Aluno visualiza
```
Aluno faz login
  → Sistema carrega historicoTreinos do usuário
  → Dashboard busca treino do dia da semana atual
  → Exibe treino prescrito
```

## Endpoints da API Utilizados

### POST /api/historico-treinos
```typescript
app.post('/api/historico-treinos', autenticar, async (req: AuthRequest, res) => {
  const { usuarioId, titulo, tipoTreino, duracao, exercicios, observacoes, origem } = req.body;
  const targetUserId = usuarioId || req.usuario?.id;
  
  const historico = await prisma.historicoTreino.create({
    data: {
      usuarioId: targetUserId, // ✅ Salva para o aluno correto
      tituloTreino: titulo || 'Treino Personalizado',
      duracao: parseInt(duracao) || 60,
      exercicios,
      observacoes: observacoes || '',
      calorias: 0
    }
  });
  
  res.json(historico);
});
```

### GET /api/historico-treinos
```typescript
app.get('/api/historico-treinos', autenticar, async (req: AuthRequest, res) => {
  const { usuarioId } = req.query;
  const targetUserId = usuarioId || req.usuario?.id;
  
  const historico = await prisma.historicoTreino.findMany({
    where: {
      usuarioId: targetUserId as string
    },
    orderBy: {
      data: 'desc'
    }
  });
  
  res.json(historico);
});
```

## Schema do Banco de Dados

```prisma
model HistoricoTreino {
  id            String   @id @default(cuid())
  usuarioId     String   // ✅ ID do aluno
  tituloTreino  String
  exercicios    Json     // Plano completo com dias da semana
  duracao       Int
  calorias      Int
  data          DateTime @default(now())
  observacoes   String?
  
  usuario       Usuario  @relation(fields: [usuarioId], references: [id])
  
  @@map("historico_treinos")
}
```

## Estrutura do Plano de Treino

```json
{
  "titulo": "Hipertrofia ABC",
  "usuarioId": "cml8bkip20000135hc9tin8v5",
  "exercicios": {
    "segunda": [
      {
        "nome": "Supino Reto",
        "series": "4",
        "repeticoes": "12",
        "carga": "80kg",
        "descanso": "60s"
      }
    ],
    "terca": [],
    "quarta": [
      {
        "nome": "Agachamento",
        "series": "4",
        "repeticoes": "10",
        "carga": "100kg",
        "descanso": "90s"
      }
    ],
    // ... outros dias
  }
}
```

## Testes Necessários

### 1. Como ADMIN
1. ✅ Fazer login como ADMIN
2. ✅ Acessar "Gerenciar Alunos"
3. ✅ Selecionar aluno "Julio Hebert"
4. ✅ Clicar em "Prescrever Treino"
5. ✅ Preencher plano de treino
6. ✅ Salvar e verificar mensagem de sucesso
7. ✅ Verificar se treino aparece no histórico do aluno

### 2. Como ALUNO
1. ✅ Fazer login como "Julio Hebert"
2. ✅ Acessar Dashboard
3. ✅ Verificar se treino prescrito aparece
4. ✅ Verificar se exercícios estão corretos
5. ✅ Testar "Começar Treino"

### 3. Verificação no Banco
```sql
-- Verificar treinos salvos
SELECT * FROM historico_treinos 
WHERE "usuarioId" = 'ID_DO_JULIO_HEBERT'
ORDER BY data DESC;
```

## Resultado Esperado

✅ Treino é salvo no banco de dados
✅ Treino persiste após reload
✅ Aluno vê o treino no dashboard
✅ Treino é exibido de acordo com o dia da semana
✅ Admin vê o treino no histórico do aluno

## Observações

- O treino é salvo com a estrutura completa (7 dias da semana)
- O aluno vê automaticamente o treino do dia da semana atual
- Se não houver treino para o dia, mostra "Dia de Descanso"
- Treinos gerados por IA também seguem o mesmo fluxo
