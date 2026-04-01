import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ erro: "Prompt é obrigatório" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.VITE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const treino = result.response.text();
    return res.status(200).json({ treino });
  } catch (error) {
    console.error("Erro IA:", error);
    return res.status(500).json({ erro: "Erro ao gerar treino com IA" });
  }
}
