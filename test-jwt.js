import jwt from 'jsonwebtoken';

const SECRET = 'fitness_tech_super_secret_key_2025';

// Gerar token
const token = jwt.sign(
  { usuarioId: 'test123', email: 'admin@fitness.com', funcao: 'ADMIN' },
  SECRET,
  { expiresIn: '7d' }
);

console.log('Token gerado:', token);

// Verificar token
try {
  const decoded = jwt.verify(token, SECRET);
  console.log('✅ Token válido:', decoded);
} catch (error) {
  console.log('❌ Token inválido:', error.message);
}

// Testar no Vercel
console.log('\nTestando no Vercel...');
