// Vercel Serverless Function Handler
import { app } from '../src/server';

// Express app já é compatível com o formato de handler da Vercel
// A Vercel automaticamente converte req/res para o formato Express
export default app;
