import React, { useState } from 'react';

const GerarTreinoIA: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [treino, setTreino] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTreino(null);
    try {
      const response = await fetch('/api/ia/gerar-treino', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (response.ok && data.treino) {
        setTreino(data.treino);
      } else {
        setError(data.detalhes || data.erro || 'Não foi possível gerar o treino.');
      }
    } catch (err) {
      setError('Erro ao conectar com a IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-black mb-4 flex items-center gap-2">
        <span role="img" aria-label="IA">🤖</span> Treino com IA
      </h1>
      <p className="text-zinc-400 mb-6">Descreva exatamente o treino que você deseja. Exemplo: "Quero um treino ABC para hipertrofia, 5 dias por semana, sem exercícios de agachamento, focando em superiores".</p>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          className="w-full p-4 border-2 border-lime-400 rounded-2xl mb-4 bg-zinc-950 text-white placeholder-zinc-500 focus:border-lime-500 outline-none transition-all"
          rows={6}
          placeholder="Descreva aqui seu treino ideal, objetivo, restrições, frequência, grupos musculares, etc..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-lime-400 text-black py-4 rounded-2xl font-black uppercase text-base hover:bg-lime-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? 'Gerando treino...' : 'Gerar Treino'}
        </button>
      </form>
      {error && <div className="text-red-500 mb-2 font-bold">{error}</div>}
      {treino && (
        <div className="bg-zinc-900 border border-lime-400/30 p-6 rounded-2xl shadow-xl mt-6 animate-in fade-in">
          <h2 className="font-black mb-2 text-lime-400">Treino Gerado:</h2>
          <pre className="whitespace-pre-wrap text-white text-sm">{treino}</pre>
        </div>
      )}
    </div>
  );
};

export default GerarTreinoIA;
