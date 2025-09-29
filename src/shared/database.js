const { Pool } = require("pg");

let pool = null;

function createPool(config) {
  const newPool = new Pool(config);

  newPool.on("error", (err) => {
    console.error("[database] pool error:", err);
  });

  return newPool;
}

async function startDatabase() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  if (pool) {
    return pool;
  }

  try {
    pool = createPool(config);
    await pool.query("SELECT 1");
    console.log(
      `[database] connection pool initialized: ${config.host}:${config.port}/${config.database}`
    );
    return pool;
  } catch (error) {
    console.error("[database] error initializing connection pool:", error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error("Database pool not initialized");
  }
  return pool;
}

async function stopDatabase() {
  if (pool) {
    try {
      await pool.end();
      console.log(`[database] connection pool terminated`);
    } catch (error) {
      console.error("[database] error terminating connection pool:", error);
    } finally {
      pool = null;
    }
  }
}

async function healthCheck() {
  try {
    const currentPool = getPool();
    await currentPool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  startDatabase,
  getPool,
  stopDatabase,
  healthCheck,
};
