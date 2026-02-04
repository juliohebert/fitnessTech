#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_T6G3YvsxAhbq@ep-gentle-field-ac10d3ig-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
export DIRECT_URL="postgresql://neondb_owner:npg_T6G3YvsxAhbq@ep-gentle-field-ac10d3ig.sa-east-1.aws.neon.tech/neondb?sslmode=require"
echo "🔄 Populando banco de PRODUÇÃO (Vercel)..."
npx tsx prisma/seed.ts
