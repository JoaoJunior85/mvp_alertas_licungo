


// Cria o pool PostgreSQL partilhado pelos handlers da API.
const { Pool } = require('pg');
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definido. Configure o ficheiro backend/.env.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Permite os certificados usados por alguns serviços geridos, como Supabase.
  ssl: { rejectUnauthorized: false },
});

// Verifica a ligação no arranque e liberta logo o cliente de diagnóstico.
pool.connect((error, client, release) => {
  if (error) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
    return;
  }

  console.log('Ligação à base de dados estabelecida.');
  release();
});

module.exports = pool;
