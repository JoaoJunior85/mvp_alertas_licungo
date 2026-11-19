-- Credenciais são guardadas como hash scrypt com salt, nunca em texto simples.
ALTER TABLE operadores_cenoe
  ADD COLUMN IF NOT EXISTS senha_hash TEXT;

ALTER TABLE operadores_cenoe
  ADD COLUMN IF NOT EXISTS cargo VARCHAR(100) NOT NULL DEFAULT 'Operador CENOE';

-- Conta fictícia para demonstração em sala. Remover ou substituir antes de operação real.
-- Credenciais de demonstração: admin@cenoe.gov.mz / 123456.
INSERT INTO operadores_cenoe (nome, email, cargo, senha_hash)
SELECT
  'Administrador de Demonstração',
  'admin@cenoe.gov.mz',
  'Administrador CENOE',
  'scrypt$9aec244ca28445921f1e9225a5efd4d7$d7cb3139bf3ea138f22f0fa7bfac4bed109c6ab81a5f2b08aded170a709f1074332fd25a091e3c28fbb1ae2620f66358e5d19501918b7343a861fd387dbc804f'
WHERE NOT EXISTS (
  SELECT 1 FROM operadores_cenoe WHERE lower(email) = lower('admin@cenoe.gov.mz')
);