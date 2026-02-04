# Sistema Multi-Tenant - FitnessTech SaaS

## Visão Geral
O FitnessTech agora é uma plataforma SaaS completa com multi-tenancy, onde cada academia tem seu próprio ambiente isolado e dados separados.

## Estrutura Multi-Tenant

### 1. Entidades Principais

#### `Academia` (Tenant)
- **ID único** para cada academia
- **Nome** da academia
- **Plano de assinatura** (BASIC, PRO, ENTERPRISE)
- **Limites** de usuários e funcionalidades
- **Logo** personalizada

#### `AuthUser` (Usuário Autenticado)
- **ID único** do usuário
- **Role** (ALUNO, PROFESSOR, NUTRI, ADMIN)
- **academiaId** - vinculação ao tenant
- **Dados pessoais** (nome, email, avatar)

### 2. Controle de Acesso por Role

#### 👨‍🎓 **ALUNO**
- Dashboard pessoal com progresso
- Sistema de treinos e exercícios  
- Análise de vídeos com IA
- Planos nutricionais
- Sistema de metas gamificado
- Loja de suplementos
- Gráficos de evolução

#### 👨‍🏫 **PROFESSOR**
- Gestão de alunos da academia
- Criação de modelos de treino
- Agenda de atendimentos
- Avaliações físicas
- Relatórios de progresso

#### 🥗 **NUTRI**
- Gestão de pacientes
- Criação de dietas personalizadas
- Diário visual alimentar
- Análise de composição corporal
- Conteúdo educacional

#### ⚙️ **ADMIN**
- Gestão financeira da academia
- CRM e leads
- Controle de estoque
- Gestão de equipe
- Métricas e analytics
- Configurações da academia

### 3. Isolamento de Dados

#### Backend (Prisma)
Todos os modelos incluem `academiaId` para isolamento:
```typescript
model Usuario {
  id        String   @id @default(cuid())
  email     String   @unique
  nome      String
  academiaId String  // Isolamento por academia
  academia  Academia @relation(fields: [academiaId], references: [id])
  // ... outros campos
}
```

#### Frontend (React Context)
```typescript
const AuthContext = React.createContext<{
  user: AuthUser | null;
  academia: Academia | null;
  token: string | null;
  // ... métodos de auth
}>();
```

### 4. Autenticação e Segurança

#### JWT Tokens
- **Payload inclui** `userId`, `academiaId`, `role`
- **Expiração** configurável
- **Refresh tokens** (implementação futura)

#### Middleware de Proteção
Todas as rotas verificam:
1. **Token válido**
2. **Usuário ativo**
3. **Permissão para a academia**
4. **Role adequada** para a operação

### 5. Fluxo de Autenticação

#### Primeiro Acesso (Registro)
1. **Admin** cria a academia
2. Recebe **dados de login**
3. Pode **convidar** outros usuários
4. Define **roles** e **permissões**

#### Login Normal
1. **Email e senha**
2. Validação no **backend**
3. Retorna **token + dados** do usuário e academia
4. **Armazenamento** no localStorage
5. **Redirecionamento** para o módulo apropriado

### 6. Navegação Dinâmica

#### Por Role
Cada tipo de usuário vê apenas suas funcionalidades:
- **Menu lateral** adaptado
- **Rotas protegidas** 
- **Componentes específicos**

#### Por Academia
- **Logo** personalizada na sidebar
- **Nome** da academia no header
- **Cores** e **branding** (futuro)

### 7. Desenvolvimento Local

#### Configuração
1. Copie `.env.example` para `.env`
2. Configure **DATABASE_URL** (Neon)
3. Configure **VITE_API_KEY** (Gemini)
4. Configure **JWT_SECRET**

#### Comandos
```bash
# Backend
npm run dev:server

# Frontend  
npm run dev

# Database
npx prisma generate
npx prisma db push
```

### 8. Considerações de Produção

#### Segurança
- [ ] Rate limiting por academia
- [ ] Criptografia de dados sensíveis
- [ ] Auditoria de ações
- [ ] Backup automático por tenant

#### Performance
- [ ] Cache por academia
- [ ] CDN para assets
- [ ] Database indexing otimizado
- [ ] Lazy loading de módulos

#### Monitoramento
- [ ] Métricas por academia
- [ ] Logs centralizados
- [ ] Alertas de utilização
- [ ] Health checks

### 9. Roadmap Futuro

#### Funcionalidades SaaS
- [ ] **Billing** e cobrança automática
- [ ] **Onboarding** guiado
- [ ] **Templates** de academia
- [ ] **Marketplace** de plugins
- [ ] **API pública** para integrações

#### Escalabilidade
- [ ] **Microservices** por módulo
- [ ] **Database sharding** por region
- [ ] **Multi-region** deployment
- [ ] **Load balancing** inteligente

---

## Como Usar

### Para Desenvolvedores
1. **Clone** o repositório
2. **Configure** as variáveis de ambiente
3. **Rode** `npm install`
4. **Execute** backend e frontend
5. **Acesse** localhost:3000

### Para Academias
1. **Registre** sua academia
2. **Configure** usuários e roles
3. **Personalize** a plataforma
4. **Treine** sua equipe
5. **Lance** para os alunos

O sistema está pronto para **produção** com arquitetura **escalável** e **segura** para múltiplas academias! 🚀