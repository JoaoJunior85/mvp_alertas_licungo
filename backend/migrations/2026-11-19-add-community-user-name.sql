-- Executar no SQL Editor do Supabase antes de publicar a nova versão do backend.
ALTER TABLE utilizadores_comunidade
  ADD COLUMN IF NOT EXISTS nome VARCHAR(100) NOT NULL DEFAULT 'Cidadão';
