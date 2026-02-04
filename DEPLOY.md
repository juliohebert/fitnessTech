# 🚀 Guia de Deploy - Vercel

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta no [Neon](https://neon.tech) (banco de dados)
3. API Key do [Google Gemini](https://ai.google.dev/)

## 📋 Passos para Deploy

### 1. Preparar Banco de Dados (Neon)

1. Acesse [neon.tech](https://neon.tech) e crie um novo projeto
2. Copie a **Connection String** (formato: `postgresql://...`)
3. Copie também a **Direct URL** (usada pelo Prisma)
4. Guarde essas URLs, você vai precisar delas

### 2. Preparar o Projeto

```bash
# 1. Certifique-se de estar na branch correta
git checkout config/production

# 2. Instale as dependências (se necessário)
npm install

# 3. Faça o build local para testar
npm run build

# 4. Teste o build localmente
npm run preview
```

### 3. Deploy na Vercel

#### Opção A: Via CLI (Recomendado)

```bash
# 1. Instale a CLI da Vercel
npm i -g vercel

# 2. Faça login na Vercel
vercel login

# 3. Deploy
vercel

# 4. Configure as variáveis de ambiente (será solicitado)
# Ou configure manualmente no dashboard
```

#### Opção B: Via Dashboard

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe seu repositório do GitHub
3. Configure as variáveis de ambiente (veja seção abaixo)
4. Clique em **Deploy**

### 4. Configurar Variáveis de Ambiente na Vercel

No dashboard da Vercel, vá em **Settings** > **Environment Variables** e adicione:

#### Obrigatórias:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://...` | Connection string do Neon |
| `DIRECT_URL` | `postgresql://...` | Direct URL do Neon |
| `JWT_SECRET` | `[chave-forte-aleatoria]` | Chave secreta para JWT |
| `VITE_API_KEY` | `[sua-api-key]` | API Key do Google Gemini |
| `NODE_ENV` | `production` | Ambiente de produção |
| `PORT` | `3002` | Porta do servidor |

#### Geração de JWT_SECRET Forte:

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Configurar Prisma no Deploy

A Vercel executa automaticamente os scripts de build. Certifique-se de que seu `package.json` tem:

```json
{
  "scripts": {
    "build": "prisma generate && vite build",
    "vercel-build": "prisma generate && prisma db push && vite build"
  }
}
```

### 6. Primeira Execução

Após o deploy:

1. Acesse o painel da Vercel
2. Vá em **Deployments** e aguarde o build finalizar
3. Clique no link da aplicação
4. O sistema estará disponível em: `https://seu-app.vercel.app`

### 7. Executar Seed (Popular Banco)

```bash
# Via terminal (após deploy)
vercel env pull .env.production.local
npm run db:seed
```

Ou execute diretamente no Neon SQL Editor:
- Copie o conteúdo de `prisma/seed.ts`
- Execute os inserts manualmente

## 🔄 Deploys Contínuos

Após a configuração inicial:

1. Qualquer push para a branch `main` → Deploy automático em produção
2. Qualquer push para outras branches → Preview deploy
3. Pull Requests → Preview deploy automático

## ⚙️ Configurações Adicionais

### Custom Domain

1. Vá em **Settings** > **Domains**
2. Adicione seu domínio customizado
3. Configure os DNS conforme instruções da Vercel

### Monitoramento

A Vercel oferece:
- Analytics de performance
- Logs de erros
- Métricas de uso

Acesse em: **Analytics** e **Logs** no dashboard

## 🐛 Troubleshooting

### Erro de Build

```bash
# Verifique os logs no dashboard da Vercel
# Ou teste localmente:
npm run build
```

### Erro de Conexão com Banco

1. Verifique se `DATABASE_URL` está correta
2. Teste a conexão:
```bash
npx prisma db push
```

### Erro de Variáveis de Ambiente

1. Certifique-se de que todas as variáveis estão configuradas
2. Faça um redeploy após adicionar novas variáveis

## 📚 Recursos

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Neon](https://neon.tech/docs)
- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação Vite](https://vitejs.dev/guide/)

## 🔐 Segurança

- ✅ JWT_SECRET deve ser único e forte
- ✅ DATABASE_URL deve ter SSL ativado (`?sslmode=require`)
- ✅ Nunca commite arquivos `.env` com dados reais
- ✅ Use variáveis de ambiente da Vercel para produção
- ✅ Mantenha suas API Keys privadas

## 🎉 Pronto!

Seu sistema FitnessTech Academy está no ar! 🚀

Acesse: `https://seu-app.vercel.app`
