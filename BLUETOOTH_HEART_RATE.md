# ❤️ Integração Bluetooth - Monitoramento de Batimento Cardíaco em Tempo Real

## 🎯 Visão Geral

O FitnessTech agora suporta **leitura em tempo real** do batimento cardíaco através de dispositivos Bluetooth compatíveis, incluindo:
- ✅ Apple Watch
- ✅ Monitores de FC Bluetooth (Polar, Garmin, Wahoo, etc)
- ✅ Smartwatches com sensor de FC
- ✅ Cintas cardíacas Bluetooth

## 🔧 Como Funciona

### Tecnologia Utilizada
- **Web Bluetooth API**: API nativa do navegador para comunicação Bluetooth Low Energy (BLE)
- **Heart Rate Service (UUID: 0x180D)**: Serviço padrão Bluetooth para monitoramento cardíaco
- **Heart Rate Measurement (UUID: 0x2A37)**: Característica que transmite os dados de BPM

### Fluxo de Conexão

1. **Usuário clica em "Conectar" no perfil**
2. Sistema tenta abrir seletor Bluetooth nativo do navegador
3. Usuário seleciona dispositivo com sensor de FC
4. Sistema conecta ao serviço Heart Rate
5. Leitura em tempo real dos batimentos é iniciada
6. Durante treino, BPM real é exibido ao invés de simulação

## 📱 Compatibilidade

### Navegadores Suportados
- ✅ **Google Chrome** (Desktop e Android) - Versão 56+
- ✅ **Microsoft Edge** (Desktop e Android) - Versão 79+
- ✅ **Opera** (Desktop e Android) - Versão 43+
- ❌ **Safari** (iOS/macOS) - Web Bluetooth ainda não suportado
- ❌ **Firefox** - Web Bluetooth não suportado por padrão

### Dispositivos
- ✅ **Apple Watch**: Funciona como monitor FC via Bluetooth (requer app de terceiros ou watchOS 8+)
- ✅ **Monitores de FC dedicados**: Polar H10, Garmin HRM, Wahoo TICKR, etc.
- ✅ **Smartwatches Android**: Wear OS com sensor FC
- ✅ **Cintas cardíacas**: Qualquer modelo com Bluetooth 4.0+

## 🚀 Como Usar

### Passo 1: Preparar o Dispositivo

#### Apple Watch
1. Certifique-se de que o Apple Watch está ligado e desbloqueado
2. Abra um app de treino no Watch (Workout, Strava, etc.) para ativar o sensor
3. Ou use um app que exponha o sensor via Bluetooth (ex: HeartWatch)

#### Outros Dispositivos
1. Ligue o dispositivo e certifique-se de que está em modo de pareamento
2. Se necessário, consulte o manual do dispositivo

### Passo 2: Conectar no FitnessTech

1. Acesse **Perfil** no app
2. Role até **Configurações > Dispositivos**
3. Clique em **"Conectar"**
4. Seletor Bluetooth do navegador será aberto
5. Escolha seu dispositivo com sensor de FC
6. Aguarde a conexão (LED verde "CONECTADO")

### Passo 3: Treinar com Monitor Real

1. Inicie um treino normalmente
2. No canto superior, você verá:
   - ❤️ **XX BPM** - Seu batimento em tempo real
   - 🟢 **SENSOR REAL** - Indicador de que está usando dados reais (não simulação)
3. O valor é atualizado automaticamente a cada batimento

## 🔍 Indicadores Visuais

### Durante o Treino
```
⏱️ 12:34
❤️ 142 BPM
🟢 SENSOR REAL
```

- **Verde pulsando**: Sensor conectado e enviando dados reais
- **Sem badge "SENSOR REAL"**: Simulação ativa (sensor não conectado)

### No Perfil
```
✅ Conectado: Apple Watch Series 8 - 8.8.1
```

## 🛠️ Troubleshooting

### Não consigo ver o seletor Bluetooth
**Causa**: Navegador não suporta Web Bluetooth ou HTTPS não está habilitado  
**Solução**:
- Use Chrome, Edge ou Opera
- Certifique-se de estar em HTTPS (ou localhost)
- Habilite Bluetooth nas configurações do navegador

### Dispositivo não aparece na lista
**Causa**: Dispositivo não está em modo de pareamento ou já está conectado a outro app  
**Solução**:
- Desconecte o dispositivo de outros apps/dispositivos
- Reinicie o dispositivo
- Certifique-se de que está próximo ao computador/celular

### BPM não atualiza ou fica travado
**Causa**: Conexão Bluetooth instável  
**Solução**:
- Aproxime o dispositivo do computador/celular
- Reconecte o dispositivo
- Verifique se há interferências (micro-ondas, múltiplos dispositivos Bluetooth)

### Funciona mas depois desconecta
**Causa**: Dispositivo entra em modo de economia de energia  
**Solução**:
- Mantenha o app do dispositivo aberto (Apple Watch)
- Desative modo de economia de bateria
- Verifique se a bateria do dispositivo não está muito baixa

### Safari/iOS não funciona
**Causa**: Safari ainda não implementou Web Bluetooth API  
**Solução**:
- Use Chrome no Android
- Aguarde atualização do Safari/iOS
- Como alternativa, use a integração Apple Health (sincronização pós-treino)

## 🔐 Segurança e Privacidade

### Dados Locais
- ✅ Conexão Bluetooth é **local** (não passa pela internet)
- ✅ Dados de BPM só são processados no navegador
- ✅ Nenhum dado é armazenado sem consentimento

### Permissões
- 🔒 Usuário precisa **autorizar explicitamente** cada conexão
- 🔒 Navegador solicita permissão sempre que um novo dispositivo é conectado
- 🔒 Dispositivo pode ser desconectado a qualquer momento

## 📊 Precisão dos Dados

### Sensores Reais vs Simulação

| Fonte | Precisão | Latência | Uso |
|-------|----------|----------|-----|
| **Sensor Bluetooth** | ⭐⭐⭐⭐⭐ 99%+ | <1s | Treinos com monitoramento real |
| **Simulação** | ⭐⭐ ~60% | 2s | Demonstração/testes |

### Tipos de Sensores

1. **Cintas Cardíacas (H10, TICKR)**: Mais precisas, leitura elétrica (ECG)
2. **Smartwatches (Apple Watch)**: Muito precisas, leitura óptica (PPG)
3. **Monitores de Pulso**: Boas, mas podem variar em movimento

## 🎯 Benefícios do Monitoramento Real

### Durante o Treino
- 📈 Controle de intensidade em tempo real
- 🎯 Manter-se na zona alvo de FC
- ⚠️ Alertas de FC muito alta/baixa
- 💪 Otimizar descanso entre séries

### Pós-Treino
- 📊 Análise precisa de calorias gastas
- 🔬 Dados para progressão/periodização
- 🏆 Badges baseados em zonas de FC
- 📈 Histórico detalhado de performance

## 🚧 Limitações Conhecidas

### Técnicas
- ❌ Safari/iOS não suporta Web Bluetooth ainda
- ⚠️ Alguns dispositivos podem não expor o sensor corretamente
- ⚠️ Alcance limitado a ~10m (Bluetooth padrão)

### Funcionais
- ⏳ Conexão pode levar 5-10 segundos
- 🔋 Uso contínuo pode consumir mais bateria do dispositivo
- 📱 Alguns smartphones Android antigos têm bugs no BLE

## 🔄 Fallback Automático

Se o sensor real **não estiver disponível** ou **falhar**:
- ✅ Sistema automaticamente usa **simulação**
- ✅ Valores gerados: 90-185 BPM (baseado em atividade)
- ✅ **Sem interrupção** do treino
- ⚠️ Badge "SENSOR REAL" não é exibido

## 📚 Referências Técnicas

### Especificações Bluetooth
- [Bluetooth Heart Rate Service Spec](https://www.bluetooth.com/specifications/specs/heart-rate-service-1-0/)
- [Web Bluetooth API Spec](https://webbluetoothcg.github.io/web-bluetooth/)
- [MDN Web Bluetooth](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)

### Compatibilidade
- [Can I Use - Web Bluetooth](https://caniuse.com/web-bluetooth)
- [Chrome Platform Status](https://chromestatus.com/feature/5264933985976320)

## 🆘 Suporte

Problemas com a integração Bluetooth?
1. Verifique a seção **Troubleshooting** acima
2. Consulte o console do navegador (F12) para erros
3. Tente com outro dispositivo Bluetooth
4. Reporte no GitHub com logs do console

---

**Nota**: Esta funcionalidade está em **beta**. Compatibilidade pode variar entre navegadores e dispositivos.
