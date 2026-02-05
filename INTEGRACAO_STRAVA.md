# 🚴 Integração com Strava - Guia de Configuração

## 📋 Visão Geral

A integração com Strava permite que usuários importem automaticamente suas atividades de corrida, ciclismo, natação e outras do Strava para o FitnessTech.

## 🔧 Configuração

### 1. Criar Aplicação no Strava

1. Acesse: https://www.strava.com/settings/api
2. Clique em **"Create & Manage Your App"**
3. Preencha o formulário:
   - **Application Name**: FitnessTech
   - **Category**: Training
   - **Club**: Deixe em branco
   - **Website**: `http://localhost:5173` (desenvolvimento) ou `https://seu-dominio.com` (produção)
   - **Authorization Callback Domain**: `localhost` (desenvolvimento) ou `seu-dominio.com` (produção)
   - **Application Description**: Plataforma de gestão de treinos e nutrição
4. Aceite os termos e clique em **"Create"**

### 2. Obter Credenciais

Após criar a aplicação, você verá:

- **Client ID**: Número de 5-6 dígitos (ex: `12345`)
- **Client Secret**: String alfanumérica longa (ex: `abc123def456...`)

⚠️ **IMPORTANTE**: Mantenha o Client Secret em segredo!

### 3. Configurar Variáveis de Ambiente

No arquivo `.env` do projeto, adicione:

```bash
# Strava OAuth
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc123def456ghi789jkl012mno345pqr678stu
STRAVA_REDIRECT_URI=http://localhost:5173/strava-callback.html
```

**Para produção**, altere a REDIRECT_URI:
```bash
STRAVA_REDIRECT_URI=https://seu-dominio.com/strava-callback.html
```

### 4. Copiar Arquivo de Callback

Certifique-se de que o arquivo `strava-callback.html` está na raiz do projeto e será servido corretamente pelo servidor.

### 5. Testar a Integração

1. Inicie o servidor backend: `npm run dev:server`
2. Inicie o frontend: `npm run dev`
3. Faça login no FitnessTech
4. Vá para **Cardio > Integrações**
5. Clique em **"Conectar Strava"**
6. Autorize o aplicativo no popup do Strava
7. Aguarde a confirmação de conexão
8. Clique em **"🔄 Sync"** para importar atividades

## 🔄 Fluxo OAuth

### Passo a Passo

1. **Usuário clica em "Conectar Strava"**
   - Frontend chama: `GET /api/integracoes/strava/auth-url`
   - Recebe URL de autorização do Strava
   - Abre popup com a URL

2. **Usuário autoriza no Strava**
   - Strava redireciona para: `http://localhost:5173/strava-callback.html?code=ABC123...`
   - Página de callback extrai o `code` da URL
   - Envia mensagem para janela pai com o código

3. **Frontend troca código por tokens**
   - Chama: `POST /api/integracoes/strava/connect` com `{ code }`
   - Backend troca código por tokens no Strava
   - Salva `access_token`, `refresh_token` e `tokenExpira` no banco
   - Retorna sucesso com info do atleta

4. **Sincronização de atividades**
   - Usuário clica em "🔄 Sync"
   - Frontend chama: `POST /api/integracoes/strava/sync`
   - Backend verifica se token está válido (renova se expirado)
   - Busca atividades dos últimos 30 dias
   - Importa novas atividades e atualiza existentes
   - Retorna quantidade de atividades processadas

## 📊 Tipos de Atividades Suportadas

O sistema mapeia automaticamente os tipos do Strava:

| Tipo Strava | Tipo Interno | Ícone |
|------------|--------------|-------|
| Run | CORRIDA | 🏃 |
| Ride | CICLISMO | 🚴 |
| Swim | NATACAO | 🏊 |
| Walk / Hike | CAMINHADA | 🚶 |
| Rowing / Kayaking | REMO | 🚣 |
| Elliptical | ELIPTICO | 🏋️ |

## 🔐 Segurança

### Renovação Automática de Tokens

Os tokens do Strava expiram após 6 horas. O sistema automaticamente:

1. Verifica se o token está expirado antes de cada sincronização
2. Se expirado, usa o `refresh_token` para obter novo `access_token`
3. Atualiza os tokens no banco de dados
4. Prossegue com a sincronização

### Revogação de Acesso

Quando o usuário desconecta:

1. Frontend chama: `DELETE /api/integracoes/strava/disconnect`
2. Backend revoga o acesso no Strava via API
3. Remove o registro de `IntegracaoExterna` do banco
4. Atividades já importadas **não são deletadas**

## 🗄️ Banco de Dados

### Modelo IntegracaoExterna

```prisma
model IntegracaoExterna {
  id               String   @id @default(cuid())
  usuarioId        String
  plataforma       PlataformaIntegracao  // STRAVA, APPLE_HEALTH, GOOGLE_FIT
  ativo            Boolean  @default(true)
  accessToken      String?
  refreshToken     String?
  tokenExpira      DateTime?
  sincronizarAuto  Boolean  @default(false)
  ultimaSync       DateTime?
  criadoEm         DateTime @default(now())
  atualizadoEm     DateTime @updatedAt
  
  usuario Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  
  @@unique([usuarioId, plataforma])
}
```

### Modelo AtividadeCardio

As atividades importadas do Strava incluem:

- `stravaId`: ID único da atividade no Strava (para evitar duplicatas)
- `origem`: `'STRAVA'`
- `tipo`: Mapeado conforme tabela acima
- `duracao`: Tempo em movimento (seconds)
- `distancia`: Distância em km
- `calorias`: Se disponível
- `velocidade`: Velocidade média
- `fcMedia`, `fcMaxima`: Frequência cardíaca (se disponível)
- `elevacaoGanha`: Ganho de elevação
- `observacoes`: Nome da atividade no Strava

## 🐛 Troubleshooting

### Erro: "Authorization callback domain doesn't match"

**Solução**: Verifique se o domínio na configuração do Strava corresponde ao usado na URL de callback.

- Desenvolvimento: Use `localhost` (sem porta)
- Produção: Use apenas o domínio (ex: `fittech.com`, não `https://fittech.com`)

### Erro: "Invalid authorization code"

**Causas possíveis**:
1. Código já foi usado (cada código só pode ser usado uma vez)
2. Código expirou (válido por 10 minutos)
3. Client ID/Secret incorretos

**Solução**: Tente conectar novamente.

### Atividades não aparecem

**Verificações**:
1. Certifique-se de que as atividades no Strava são dos últimos 30 dias
2. Verifique os logs do backend para erros
3. Confirme que o token está válido
4. Tente desconectar e reconectar

### Token sempre expira

**Solução**: Verifique se a função `renovarTokenStrava()` está sendo chamada corretamente e se o `refresh_token` está sendo salvo.

## 📱 Limitações da API Strava

- **Rate Limits**: 100 requisições por 15 minutos, 1000 por dia
- **Escopo**: Requer permissão `activity:read_all`
- **Webhooks**: Não implementado (sincronização manual apenas)
- **Fotos**: Não importadas (apenas dados da atividade)
- **Segmentos**: Não importados

## 🚀 Próximos Passos

- [ ] Implementar webhooks para sincronização automática
- [ ] Importar fotos das atividades
- [ ] Mostrar mapas das rotas
- [ ] Sincronizar de volta para o Strava (write permissions)
- [ ] Importar dados de segmentos e KOMs
- [ ] Dashboard comparativo com amigos do Strava

## 📚 Referências

- [Strava API Documentation](https://developers.strava.com/docs/reference/)
- [OAuth 2.0 Guide](https://developers.strava.com/docs/authentication/)
- [Activity Types](https://developers.strava.com/docs/reference/#api-models-ActivityType)
