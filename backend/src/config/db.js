


// Cria o pool PostgreSQL partilhado pelos handlers da API.
const { Pool } = require('pg');

require('dotenv').config();

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
