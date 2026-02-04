# 📹 Guia de Upload de Vídeos de Exercícios

## 📋 Visão Geral

O sistema permite que alunos gravem ou façam upload de vídeos dos seus exercícios para avaliação por instrutores.

## 🗄️ Estrutura do Banco de Dados

### Tabela: `videos_exercicio`

```sql
- id: String (identificador único)
- usuarioId: String (ID do aluno)
- historicoTreinoId: String? (opcional - vincula ao treino específico)
- tituloExercicio: String (nome do exercício)
- urlVideo: String (URL do vídeo hospedado)
- urlThumbnail: String? (miniatura do vídeo)
- duracao: Int? (duração em segundos)
- tamanhoArquivo: Int? (tamanho em bytes)
- status: String (pendente | aprovado | rejeitado)
- feedbackInstrutor: String? (comentários do instrutor)
- avaliadoEm: DateTime? (data da avaliação)
- avaliadoPor: String? (ID do instrutor)
- criadoEm: DateTime (data de criação)
```

## 🔌 API Endpoints

### 1. Upload de Vídeo (Aluno)
```
POST /api/videos-exercicio
Authorization: Bearer {token}

Body:
{
  "historicoTreinoId": "clx123...", // opcional
  "tituloExercicio": "Supino Reto",
  "urlVideo": "https://cloudinary.com/video/abc123.mp4",
  "urlThumbnail": "https://cloudinary.com/image/thumb.jpg",
  "duracao": 45,
  "tamanhoArquivo": 5242880
}
```

### 2. Listar Meus Vídeos (Aluno)
```
GET /api/videos-exercicio?status=pendente
Authorization: Bearer {token}

Filtros opcionais:
- status: pendente | aprovado | rejeitado
```

### 3. Buscar Vídeo Específico
```
GET /api/videos-exercicio/:id
Authorization: Bearer {token}
```

### 4. Deletar Vídeo (Aluno)
```
DELETE /api/videos-exercicio/:id
Authorization: Bearer {token}
```

### 5. Avaliar Vídeo (Instrutor)
```
PUT /api/videos-exercicio/:id/avaliar
Authorization: Bearer {token}

Body:
{
  "status": "aprovado", // ou "rejeitado"
  "feedbackInstrutor": "Ótima execução! Apenas atente para a posição dos cotovelos."
}
```

### 6. Listar Vídeos Pendentes (Instrutor)
```
GET /api/videos-exercicio/pendentes/todos
Authorization: Bearer {token}
```

## 📦 Serviços de Hospedagem de Vídeos

### Opção 1: Cloudinary (Recomendado)
**Vantagens:**
- ✅ Plano gratuito generoso (25 GB storage, 25 GB bandwidth)
- ✅ Upload direto do navegador
- ✅ Transformação automática de vídeos
- ✅ Geração automática de thumbnails
- ✅ Player de vídeo otimizado

**Instalação:**
```bash
npm install cloudinary
```

**Configuração (.env):**
```env
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
```

**Exemplo de Upload no Frontend:**
```javascript
const uploadParaCloudinary = async (arquivo) => {
  const formData = new FormData();
  formData.append('file', arquivo);
  formData.append('upload_preset', 'fitness_videos'); // criar no Cloudinary
  
  const resposta = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    {
      method: 'POST',
      body: formData
    }
  );
  
  const dados = await resposta.json();
  return {
    urlVideo: dados.secure_url,
    urlThumbnail: dados.secure_url.replace('/video/', '/image/').replace(/\.[^.]+$/, '.jpg'),
    duracao: dados.duration,
    tamanhoArquivo: dados.bytes
  };
};
```

### Opção 2: AWS S3 + CloudFront
**Vantagens:**
- ✅ Escalabilidade ilimitada
- ✅ Integração com serviços AWS
- ✅ Controle total sobre storage

**Instalação:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Opção 3: Firebase Storage
**Vantagens:**
- ✅ Fácil integração
- ✅ Plano gratuito (5GB storage, 1GB/dia download)
- ✅ Upload resumível

**Instalação:**
```bash
npm install firebase
```

## 🎨 Exemplo de Implementação no Frontend

### 1. Componente de Upload de Vídeo

```tsx
import { useState } from 'react';
import { Upload, Video, Check, X } from 'lucide-react';

export function UploadVideoExercicio() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [progresso, setProgresso] = useState(0);
  const [carregando, setCarregando] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setArquivo(file);
    } else {
      alert('Por favor, selecione um arquivo de vídeo válido');
    }
  };

  const handleUpload = async () => {
    if (!arquivo) return;
    
    setCarregando(true);
    
    try {
      // 1. Upload para Cloudinary
      const dadosVideo = await uploadParaCloudinary(arquivo);
      
      // 2. Salvar no banco via API
      const token = localStorage.getItem('token');
      const resposta = await fetch('http://localhost:3001/api/videos-exercicio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tituloExercicio: 'Supino Reto', // ou pegar do formulário
          ...dadosVideo
        })
      });
      
      if (resposta.ok) {
        alert('Vídeo enviado com sucesso! Aguarde a avaliação do instrutor.');
        setArquivo(null);
      }
    } catch (erro) {
      console.error('Erro ao fazer upload:', erro);
      alert('Erro ao enviar vídeo. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Video className="w-6 h-6" />
        Enviar Vídeo de Exercício
      </h3>
      
      <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
        {!arquivo ? (
          <label className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-[#00ff87]" />
            <p className="text-gray-400 mb-2">Clique para selecionar ou arraste o vídeo</p>
            <p className="text-sm text-gray-500">MP4, MOV, AVI (máx. 100MB)</p>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div>
            <Video className="w-12 h-12 mx-auto mb-4 text-[#00ff87]" />
            <p className="text-white mb-4">{arquivo.name}</p>
            <p className="text-sm text-gray-400 mb-4">
              {(arquivo.size / 1024 / 1024).toFixed(2)} MB
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleUpload}
                disabled={carregando}
                className="bg-[#00ff87] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#00cc6f] disabled:opacity-50"
              >
                {carregando ? 'Enviando...' : 'Enviar Vídeo'}
              </button>
              <button
                onClick={() => setArquivo(null)}
                className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600"
              >
                Cancelar
              </button>
            </div>
            
            {carregando && (
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-[#00ff87] h-2 rounded-full transition-all"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. Lista de Vídeos com Status

```tsx
export function MeusVideos() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    carregarVideos();
  }, []);

  const carregarVideos = async () => {
    const token = localStorage.getItem('token');
    const resposta = await fetch('http://localhost:3001/api/videos-exercicio', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dados = await resposta.json();
    setVideos(dados);
  };

  return (
    <div className="space-y-4">
      {videos.map(video => (
        <div key={video.id} className="bg-[#1a1a1a] p-4 rounded-lg flex items-center gap-4">
          <img 
            src={video.urlThumbnail} 
            alt={video.tituloExercicio}
            className="w-32 h-20 object-cover rounded"
          />
          
          <div className="flex-1">
            <h4 className="font-bold">{video.tituloExercicio}</h4>
            <p className="text-sm text-gray-400">
              {new Date(video.criadoEm).toLocaleDateString()}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              {video.status === 'pendente' && (
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm">
                  ⏳ Aguardando Avaliação
                </span>
              )}
              {video.status === 'aprovado' && (
                <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" /> Aprovado
                </span>
              )}
              {video.status === 'rejeitado' && (
                <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm flex items-center gap-1">
                  <X className="w-4 h-4" /> Necessita Correção
                </span>
              )}
            </div>
            
            {video.feedbackInstrutor && (
              <div className="mt-2 p-3 bg-[#252525] rounded">
                <p className="text-sm text-gray-300">
                  <strong>Feedback:</strong> {video.feedbackInstrutor}
                </p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => window.open(video.urlVideo, '_blank')}
            className="px-4 py-2 bg-[#00ff87] text-black rounded-lg font-semibold hover:bg-[#00cc6f]"
          >
            Assistir
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 Fluxo Completo

1. **Aluno grava/seleciona vídeo** → Upload para Cloudinary
2. **Sistema salva no banco** → Status: `pendente`
3. **Instrutor recebe notificação** → Acessa lista de vídeos pendentes
4. **Instrutor assiste e avalia** → Aprova/Rejeita com feedback
5. **Aluno recebe notificação** → Pode ver feedback e corrigir se necessário

## 🔐 Segurança

- ✅ Validar tamanho máximo do arquivo (recomendado: 100MB)
- ✅ Validar formato de arquivo (MP4, MOV, AVI)
- ✅ Autenticação obrigatória em todos os endpoints
- ✅ Apenas o dono pode deletar seus vídeos
- ✅ Apenas instrutores podem avaliar vídeos

## 📊 Métricas Úteis

```sql
-- Total de vídeos por status
SELECT status, COUNT(*) as total 
FROM videos_exercicio 
GROUP BY status;

-- Tempo médio de avaliação
SELECT AVG(EXTRACT(EPOCH FROM (avaliadoEm - criadoEm))/3600) as horas_media
FROM videos_exercicio 
WHERE avaliadoEm IS NOT NULL;
```

## 🚀 Próximos Passos

1. Configure uma conta no Cloudinary (gratuita)
2. Crie um "upload preset" no painel do Cloudinary
3. Adicione as credenciais no `.env`
4. Implemente o componente de upload no frontend
5. Teste o fluxo completo!
