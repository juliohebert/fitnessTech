// Simular ambiente Vercel
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_T6G3YvsxAhbq@ep-gentle-field-ac10d3ig-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require";
process.env.JWT_SECRET = "fitness_tech_super_secret_key_2025";
process.env.NODE_ENV = "production";

import handler from './api/index.js';

// Mock de req/res
const mockReq = (url, method, body) => ({
  url,
  method,
  body,
  headers: {}
});

const mockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader: (key, value) => { res.headers[key] = value; },
    status: (code) => { res.statusCode = code; return res; },
    json: (data) => { res.body = data; console.log(`\n✅ Response ${res.statusCode}:`, JSON.stringify(data, null, 2)); },
    end: () => { console.log('END'); }
  };
  return res;
};

console.log('🧪 TESTE 1: Debug endpoint');
await handler(mockReq('/api/debug/usuarios', 'GET'), mockRes());

console.log('\n🧪 TESTE 2: Login admin');
await handler(
  mockReq('/api/auth/login', 'POST', { email: 'admin@fitness.com', senha: '123456' }),
  mockRes()
);

console.log('\n🧪 TESTE 3: Login professor');
await handler(
  mockReq('/api/auth/login', 'POST', { email: 'professor@fitness.com', senha: '123456' }),
  mockRes()
);

process.exit(0);
