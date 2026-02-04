#!/bin/bash
# Lista de endpoints que precisam ser corrigidos
endpoints=(
  "/api/auth/login"
  "/api/refeicoes-diario"
  "/api/refeicoes-diario/\${id}/feedback"
  "/api/analises-composicao"
  "/api/conteudos-educacionais"
  "/api/admin/usuarios"
  "/api/admin/instrutores"
  "/api/admin/usuarios/\${usuarioId}/status"
  "/api/admin/vinculos"
  "/api/admin/estatisticas"
  "/api/auth/registrar"
)

# Para cada endpoint, corrigir as linhas quebradas
for endpoint in "${endpoints[@]}"; do
  # Escapar caracteres especiais para sed
  escaped_endpoint=$(echo "$endpoint" | sed 's/[[\.*^$(){}?+|]/\\&/g')
  
  # Corrigir linhas que terminam com `${API_BASE_URL} seguido do endpoint na próxima linha
  sed -i "s|\`\${API_BASE_URL}$|\`\${API_BASE_URL}$endpoint\`, {|g" App.tsx 2>/dev/null || true
done
