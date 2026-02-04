# 🚀 Guia Completo de Instalação - FitnessTech

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Neon (gratuita): https://neon.tech
- Git (opcional)

## 🔧 Instalação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados Neon

#### 2.1. Criar Projeto no Neon

1. Acesse https://neon.tech e faça login
2. Clique em **Create Project**
3. Nome: `fitnesstec`
4. Region: Escolha a mais próxima (ex: US East)
5. Clique em **Create Project**

#### 2.2. Copiar Connection Strings

Após criar, você verá duas strings de conexão:
- **Connection String**: Para o Prisma usar
- **Direct URL**: Para migrations

#### 2.3. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env` e cole suas connection strings:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/fitnesstec?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/fitnesstec?sslmode=require"
JWT_SECRET="sua_chave_secreta_aqui_mude_em_producao"
PORT=3001
```

#### 2.4. Criar as Tabelas no Banco

```bash
# Gerar Prisma Client
npm run db:generate

# Criar tabelas no Neon
npm run db:push
```

#### 2.5. Popular com Dados de Teste (Opcional)

```bash
npm run db:seed
```

Isso vai criar:
- ✅ Usuário de teste: `teste@fitness.com` / senha: `123456`
- ✅ 4 grupos sociais
- ✅ 3 badges
- ✅ 2 metas
- ✅ 2 posts no feed

### 3. Configurar Frontend

```bash
# Criar arquivo de configuração do frontend
cp .env.local.example .env.local
```

Conteúdo do `.env.local`:
```env
VITE_API_URL=http://localhost:3001/api
```

## 🎮 Executar o Projeto

### Modo Desenvolvimento (2 Terminais)

**Terminal 1 - Backend API:**
```bash
npm run dev:server
```

Você verá:
```
🚀 Servidor rodando na porta 3001
📡 API: http://localhost:3001/api
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Acesse: http://localhost:5173

### Testar a API

```bash
# Health check
curl http://localhost:3001/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "message": "FitnessTech API está rodando!"
}
```

## 📊 Visualizar Banco de Dados

Abrir Prisma Studio (interface gráfica):

```bash
npm run db:studio
```

Acesse: http://localhost:5555

Você pode ver e editar todos os dados diretamente!

## 🔐 Fazer Login

### Pelo App

1. Acesse http://localhost:5173
2. Clique em **Criar Conta Grátis** (canto inferior direito)
3. Preencha os dados:
   - Nome: Seu Nome
   - Email: seu@email.com
   - Senha: 123456
   - CPF: 123.456.789-00
   - Telefone: (11) 98765-4321
4. Escolha o papel: **Aluno**
5. Escolha o plano: **Gratuito** ou **Pro**
6. Clique em **Finalizar Cadastro**

### Ou Use o Usuário de Teste

Se executou o seed:
- **Email**: teste@fitness.com
- **Senha**: 123456

## 📡 Endpoints da API

### Autenticação
```bash
# Registrar
POST /api/auth/register
{
  "email": "teste@email.com",
  "password": "123456",
  "name": "João Silva",
  "role": "ALUNO",
  "plan": "pro"
}

# Login
POST /api/auth/login
{
  "email": "teste@email.com",
  "password": "123456"
}
```

### Perfil (requer autenticação)
```bash
# Ver perfil
GET /api/user/profile
Headers: Authorization: Bearer SEU_TOKEN

# Atualizar perfil
PUT /api/user/profile
Headers: Authorization: Bearer SEU_TOKEN
{
  "name": "João Silva Atualizado",
  "phone": "(11) 99999-9999"
}
```

### Treinos
```bash
# Histórico
GET /api/workouts/history

# Salvar treino
POST /api/workouts/history
{
  "workoutTitle": "Peito e Tríceps",
  "exercises": [...],
  "duration": 60,
  "calories": 450
}
```

### Mais endpoints no arquivo: BANCO_DE_DADOS.md

## 🐛 Solução de Problemas

### Erro: "Can't reach database server"

**Problema**: Não consegue conectar ao Neon

**Solução**:
1. Verifique se as connection strings no `.env` estão corretas
2. Certifique-se de incluir `?sslmode=require` no final
3. Teste a conexão:
```bash
npx prisma db push
```

### Erro: "Port 3001 already in use"

**Problema**: Porta 3001 já está em uso

**Solução**:
```bash
# Mude a porta no .env
PORT=3002

# Ou mate o processo:
lsof -ti:3001 | xargs kill -9
```

### Erro: "Prisma Client not generated"

**Problema**: Falta gerar o Prisma Client

**Solução**:
```bash
npm run db:generate
```

### Frontend não conecta à API

**Problema**: CORS ou URL errada

**Solução**:
1. Verifique se o backend está rodando (http://localhost:3001/api/health)
2. Confirme o `.env.local` tem:
```
VITE_API_URL=http://localhost:3001/api
```
3. Reinicie o frontend

## 📦 Scripts Disponíveis

```bash
# Frontend
npm run dev              # Inicia frontend (Vite)
npm run build            # Build de produção
npm run preview          # Preview do build

# Backend
npm run dev:server       # Inicia API com hot-reload

# Database
npm run db:generate      # Gera Prisma Client
npm run db:push          # Cria/atualiza tabelas no Neon
npm run db:studio        # Abre Prisma Studio
npm run db:seed          # Popula banco com dados de teste
```

## 🌐 Deploy (Produção)

### Backend (Railway/Render)

1. Crie conta no Railway ou Render
2. Conecte seu repositório GitHub
3. Adicione variáveis de ambiente:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. Deploy automático!

### Frontend (Vercel)

1. Crie conta no Vercel
2. Importe o projeto do GitHub
3. Adicione variável:
   - `VITE_API_URL=https://sua-api.railway.app/api`
4. Deploy!

## 📚 Estrutura do Projeto

```
fitnessTech/
├── src/
│   ├── server.ts          # Backend API (Express)
│   ├── api.ts             # Cliente API para frontend
│   └── App.tsx            # Frontend React
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   └── seed.ts            # Dados iniciais
├── .env                   # Config backend (NÃO commitar)
├── .env.local             # Config frontend (NÃO commitar)
├── package.json           # Dependências
└── BANCO_DE_DADOS.md      # Documentação completa
```

## ✅ Checklist de Configuração

- [ ] Node.js 18+ instalado
- [ ] Conta criada no Neon
- [ ] Projeto criado no Neon
- [ ] Connection strings copiadas
- [ ] Arquivo `.env` criado e configurado
- [ ] Arquivo `.env.local` criado
- [ ] `npm install` executado
- [ ] `npm run db:generate` executado
- [ ] `npm run db:push` executado com sucesso
- [ ] `npm run db:seed` executado (opcional)
- [ ] Backend rodando (Terminal 1)
- [ ] Frontend rodando (Terminal 2)
- [ ] Health check funcionando
- [ ] Login funcionando
- [ ] Prisma Studio aberto (opcional)

## 🎉 Pronto!

Agora você tem um SaaS completo com:
- ✅ Backend escalável (Express + TypeScript)
- ✅ Banco de dados PostgreSQL no Neon (gratuito)
- ✅ Autenticação JWT
- ✅ Multi-tenancy pronto
- ✅ 50+ endpoints REST
- ✅ Frontend React integrado
- ✅ Pronto para deploy

## 🆘 Suporte

Erros? Dúvidas? Abra uma issue ou consulte:
- Documentação Neon: https://neon.tech/docs
- Documentação Prisma: https://prisma.io/docs
- BANCO_DE_DADOS.md (neste projeto)

Bom código! 💪🚀
