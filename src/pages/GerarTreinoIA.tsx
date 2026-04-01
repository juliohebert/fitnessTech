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
      if (data.treino) {
        setTreino(data.treino);
      } else {
        setError('Não foi possível gerar o treino.');
      }
    } catch (err) {
      setError('Erro ao conectar com a IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Gerar Treino com IA</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          className="w-full p-3 border rounded mb-2"
          rows={4}
          placeholder="Descreva o treino que deseja..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-lime-500 text-black px-6 py-2 rounded font-bold hover:bg-lime-600 transition"
          disabled={loading}
        >
          {loading ? 'Gerando...' : 'Gerar Treino'}
        </button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {treino && (
        <div className="bg-zinc-100 p-4 rounded shadow">
          <h2 className="font-bold mb-2">Treino Gerado:</h2>
          <pre className="whitespace-pre-wrap">{treino}</pre>
        </div>
      )}
    </div>
  );
};

export default GerarTreinoIA;
