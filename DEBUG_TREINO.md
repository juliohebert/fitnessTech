# 🔍 Debug: Treino Não Está Salvando

## Como Verificar os Logs

### 1. Abra o Console do Navegador
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá para a aba **Console**

### 2. Tente Salvar um Treino
Quando você clicar em "Salvar Plano de Treino", deve ver:

```
🎯 Iniciando salvamento do treino...
👤 Aluno selecionado: {id: "xxx", nome: "Julio Hebert", ...}
📋 Plano atualizado: {segunda: [...], terca: [...], ...}
🔑 Token encontrado: Sim
📤 Enviando dados do treino: {...}
🔄 Salvando treino: {...}
✅ Treino salvo com sucesso: {id: "xxx", ...}
```

### 3. Possíveis Erros e Soluções

#### ❌ "Token encontrado: Não"
**Problema:** Você não está autenticado
**Solução:** 
```bash
# Faça logout e login novamente
```

#### ❌ "Erro: Aluno não selecionado corretamente"
**Problema:** O aluno não foi carregado
**Solução:**
- Volte para a lista de alunos
- Selecione o aluno novamente
- Tente prescrever o treino

#### ❌ "Erro na resposta da API: {erro: 'xxx'}"
**Problema:** API retornou erro
**Verifique:**
- Se o servidor está rodando (porta 3002)
- Os logs do terminal do servidor

#### ❌ "Failed to fetch" ou "Network error"
**Problema:** Servidor não está respondendo
**Solução:**
```bash
# Verifique se o servidor está rodando
cd /home/julio/Documentos/www/pessoal/fitnessTech
npm run dev
```

## Logs do Servidor

No terminal onde o servidor está rodando, você deve ver:

```
📥 Recebendo requisição para salvar treino: {...}
👤 Usuario alvo: xxx
📋 Titulo: Hipertrofia ABC
💪 Exercicios: {"segunda":[{"nome":"Supino",...
✅ Treino salvo no banco com ID: yyy
```

## Verificar no Banco de Dados

```sql
-- Ver todos os treinos do aluno
SELECT 
  id,
  "usuarioId",
  "tituloTreino",
  data,
  duracao
FROM historico_treinos
WHERE "usuarioId" = 'ID_DO_ALUNO'
ORDER BY data DESC;

-- Ver o último treino salvo
SELECT * FROM historico_treinos 
ORDER BY data DESC 
LIMIT 1;
```

## Checklist de Verificação

- [ ] Servidor está rodando na porta 3002
- [ ] Cliente está rodando na porta 3000
- [ ] Você está logado como ADMIN
- [ ] O aluno está selecionado
- [ ] O plano de treino tem título preenchido
- [ ] Há exercícios cadastrados em pelo menos um dia
- [ ] Console do navegador não mostra erros em vermelho
- [ ] Terminal do servidor mostra os logs de salvamento

## Teste Rápido

1. **Como ADMIN:**
   ```
   Email: admin@fitness.com
   Senha: 123456
   ```

2. **Acessar:**
   - Menu lateral → "Gerenciar Alunos"
   - Selecionar aluno "Julio Hebert"
   - Clicar em "Prescrever Treino"

3. **Preencher:**
   - Título: "Teste Treino"
   - Dia: Segunda
   - Adicionar 1 exercício:
     - Nome: "Supino"
     - Séries: 4
     - Reps: 12
     - Carga: 80kg
     - Descanso: 60s

4. **Salvar e Verificar:**
   - Clicar em "Salvar Plano de Treino"
   - Verificar logs no console
   - Fazer logout
   - Login como aluno (email do Julio Hebert)
   - Verificar se o treino aparece no dashboard

## URLs Importantes

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3002/api
- **Endpoint de treinos:** http://localhost:3002/api/historico-treinos

## Se Ainda Não Funcionar

Compartilhe os logs que aparecem:
1. No console do navegador (F12)
2. No terminal do servidor

Isso me ajudará a identificar exatamente onde está o problema!
