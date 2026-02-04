# 🗄️ Configuração do Banco de Dados Neon PostgreSQL

## 📝 Passo a Passo para Configurar

### 1. Criar Conta no Neon (Gratuito)

1. Acesse [https://neon.tech](https://neon.tech)
2. Clique em **Sign Up** e crie sua conta (pode usar GitHub)
3. Após login, clique em **Create Project**

### 2. Configurar o Projeto

1. **Nome do Projeto**: `fitnesstec` (ou escolha outro nome)
2. **Region**: Escolha a mais próxima (exemplo: `US East (Ohio)`)
3. **PostgreSQL Version**: Deixe a versão mais recente (15+)
4. Clique em **Create Project**

### 3. Copiar Connection Strings

Após criar o projeto, você verá as connection strings:

```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/fitnesstec?sslmode=require
```

**IMPORTANTE**: Copie ambas as strings:
- **Connection String** (para DATABASE_URL)
- **Direct URL** (para DIRECT_URL)

### 4. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e substitua pelas suas connection strings:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/fitnesstec?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/fitnesstec?sslmode=require"
JWT_SECRET="mude_para_uma_chave_secreta_forte"
PORT=3001
```

### 5. Instalar Dependências

```bash
npm install
```

### 6. Gerar e Executar Migrations

```bash
# Gerar o Prisma Client
npx prisma generate

# Criar as tabelas no banco
npx prisma db push

# (Opcional) Abrir Prisma Studio para visualizar o banco
npx prisma studio
```

### 7. Iniciar o Servidor

```bash
# Desenvolvimento
npm run dev:server

# Ou com tsx
npx tsx src/server.ts
```

### 8. Testar a API

Acesse: `http://localhost:3001/api/health`

Você deve ver:
```json
{
  "status": "ok",
  "message": "FitnessTech API está rodando!"
}
```

## 🔌 Endpoints Disponíveis

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Fazer login

### Perfil
- `GET /api/user/profile` - Buscar perfil
- `PUT /api/user/profile` - Atualizar perfil

### Treinos
- `GET /api/workouts/history` - Histórico de treinos
- `POST /api/workouts/history` - Salvar treino
- `GET /api/workouts/notes` - Notas de treino
- `POST /api/workouts/notes` - Adicionar nota

### Progresso
- `GET /api/progress/photos` - Fotos de progresso
- `POST /api/progress/photos` - Adicionar foto
- `DELETE /api/progress/photos/:id` - Deletar foto
- `GET /api/progress/measurements` - Medidas corporais
- `POST /api/progress/measurements` - Adicionar medida

### Gamificação
- `GET /api/goals` - Metas
- `POST /api/goals` - Criar meta
- `PATCH /api/goals/:id` - Atualizar meta
- `GET /api/badges` - Badges conquistadas
- `POST /api/badges` - Adicionar badge
- `GET /api/challenges` - Desafios ativos
- `POST /api/challenges` - Criar desafio
- `PATCH /api/challenges/:id` - Atualizar progresso

### Social
- `GET /api/social/posts` - Feed de posts
- `POST /api/social/posts` - Criar post
- `PATCH /api/social/posts/:id/like` - Curtir post
- `GET /api/social/groups` - Listar grupos
- `POST /api/social/groups/:id/join` - Entrar em grupo
- `GET /api/social/ranking` - Ver ranking
- `POST /api/social/ranking` - Atualizar pontos

### Notificações
- `GET /api/notifications` - Listar notificações
- `POST /api/notifications` - Criar notificação
- `PATCH /api/notifications/:id/read` - Marcar como lida

### Carrinho
- `GET /api/cart` - Ver carrinho
- `POST /api/cart` - Adicionar produto
- `DELETE /api/cart/:id` - Remover produto

## 🔒 Autenticação

Todas as rotas (exceto `/api/auth/*`) requerem autenticação via Bearer Token:

```javascript
headers: {
  'Authorization': 'Bearer SEU_TOKEN_JWT'
}
```

## 📊 Visualizar Banco de Dados

Execute `npx prisma studio` para abrir interface gráfica do banco.

## 🚀 Próximos Passos

1. ✅ Banco configurado
2. ⏳ Integrar frontend com API
3. ⏳ Adicionar upload de imagens (Cloudinary/S3)
4. ⏳ Implementar real-time com WebSockets
5. ⏳ Deploy no Vercel/Railway

## 🆓 Limites do Plano Gratuito Neon

- ✅ 512 MB de armazenamento
- ✅ 1 projeto
- ✅ 10 branches
- ✅ Conexões ilimitadas
- ✅ SSL automático
- ✅ Backups automáticos (7 dias)

Perfeito para desenvolvimento e MVPs! 🎉
