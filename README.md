# 🏋️ FitnessTech SaaS - Plataforma Multi-Tenant para Academias

> **Plataforma SaaS completa para gestão de academias com multi-tenancy, IA e gamificação.**

## 🚀 Características Principais

### 🏢 **Multi-Tenancy Nativo**
- **Isolamento completo** de dados por academia
- **Autenticação JWT** segura
- **Roles dinâmicas** (ALUNO, PROFESSOR, NUTRI, ADMIN)
- **Configurações personalizadas** por academia

### 🤖 **Inteligência Artificial**
- **Análise biomecânica** de exercícios via Google Gemini
- **Feedback em tempo real** sobre postura
- **Geração automática** de dietas personalizadas
- **Síntese de voz** para orientações

### 🎮 **Sistema Gamificado**
- **Badges** e conquistas desbloqueáveis
- **Streaks** de treino motivacionais
- **Desafios** temporais com prêmios
- **Rankings** e competições

### 📱 **Experiência Mobile-First**
- **Design responsivo** completo
- **PWA** com instalação nativa
- **Offline support** (futuro)
- **Push notifications** (futuro)

## 🎯 Módulos por Tipo de Usuário

### 👨‍🎓 **ALUNO**
- ✅ Dashboard personalizado com métricas
- ✅ Sistema de treinos com vídeos demonstrativos
- ✅ Análise de movimento com IA (upload/gravação)
- ✅ Planos nutricionais adaptativos
- ✅ Sistema de metas e conquistas
- ✅ Marketplace de suplementos
- ✅ Gráficos de evolução corporal

### 👨‍🏫 **PROFESSOR**
- ✅ Gestão de alunos com histórico completo
- ✅ Criação de modelos de treino
- ✅ Agenda de atendimentos
- ✅ Sistema de avaliações físicas
- ✅ Relatórios de progresso detalhados

### 🥗 **NUTRI (Nutricionista)**
- ✅ Gestão de pacientes
- ✅ Criação de dietas com IA
- ✅ Diário visual alimentar
- ✅ Análise de composição corporal
- ✅ Biblioteca de conteúdo educacional

### ⚙️ **ADMIN (Administrador)**
- ✅ Dashboard financeiro
- ✅ CRM e gestão de leads
- ✅ Controle de estoque
- ✅ Gestão de equipe
- ✅ Analytics avançados
- ✅ Configurações da academia

## 🛠️ Stack Tecnológica

### **Frontend**
- **React 19.2.4** + TypeScript
- **Vite 6.2.0** para build otimizado
- **Tailwind CSS** para styling
- **Lucide Icons** para ícones
- **Recharts** para gráficos

### **Backend**
- **Express 5.2.1** + TypeScript
- **Prisma 5.22.0** como ORM
- **PostgreSQL** (Neon) como database
- **JWT** para autenticação
- **bcryptjs** para criptografia

### **IA & Integrações**
- **Google Gemini 2.5-flash** para análise de vídeo
- **MediaRecorder API** para captura
- **SpeechSynthesis API** para áudio

## 📦 Instalação e Configuração

### 1. **Clone o Repositório**
```bash
git clone https://github.com/seu-usuario/fitnesTech.git
cd fitnesTech
npm install
```

### 2. **Configure as Variáveis de Ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"

# Google Gemini AI
VITE_API_KEY="sua_api_key_gemini"

# JWT Secret
JWT_SECRET="sua_jwt_secret_super_forte"

# API URL
VITE_API_URL="http://localhost:3001/api"
```

### 3. **Configurar Banco de Dados**
```bash
npx prisma generate
npx prisma db push
```

### 4. **Executar a Aplicação**

**Backend (Terminal 1):**
```bash
npm run dev:server
```

**Frontend (Terminal 2):**
```bash
npm run dev
```

**Acesse:** http://localhost:3000

## 🔐 Sistema de Autenticação

### **Registro da Academia**
1. Acesse a aplicação
2. Clique em "Crie sua academia"
3. Preencha os dados da academia
4. O primeiro usuário será **ADMIN**

### **Login**
1. Use email e senha cadastrados
2. Sistema identifica automaticamente:
   - **Academia** (tenant)
   - **Role** do usuário
   - **Permissões** específicas

### **Convite de Usuários**
Apenas **ADMINs** podem convidar novos usuários para a academia.

---

<div align="center">
  <b>FitnessTech - Transformando academias através da tecnologia 🚀</b>
</div>

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1FUQqvUQzI7XPhg0vnuyki_woih6PMr8T

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
