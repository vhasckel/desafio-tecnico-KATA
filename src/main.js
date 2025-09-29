const cors = require("./middlewares/cors");
const notFoundHandler = require("./middlewares/notFoundHandler");
const errorHandler = require("./middlewares/errorHandler");
const dotenv = require("dotenv");

const express = require("express");
const routes = require("./routes");
const { startDatabase, getPool } = require("./shared/database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Servidor rodando: http://localhost:${PORT}`);

  try {
    await startDatabase();
    const pool = getPool();
    const res = await pool.query("SELECT * FROM products LIMIT 5");
    console.log(`[database] found ${res.rows.length} products`);
  } catch (error) {
    console.error("Erro ao inicializar database:", error.message);
    console.log(
      "Servidor continuará rodando, mas funcionalidades de banco podem não funcionar"
    );
  }
});

module.exports = app;
