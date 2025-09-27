const cors = require("./middlewares/cors");
const notFoundHandler = require("./middlewares/notFoundHandler");
const errorHandler = require("./middlewares/errorHandler");

const express = require("express");
const routes = require("./routes");
const { testConnection, pool } = require("./config/database");

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
  await testConnection();
});

(async () => {
  const res = await pool.query("SELECT * FROM products");
  console.log(res.rows);
})();

module.exports = app;
