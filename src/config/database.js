const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Conexão com PostgreSQL OK:", res.rows[0]);
  } catch (err) {
    console.error("Erro na conexão com PostgreSQL:", err);
  }
}

module.exports = { pool, testConnection };
