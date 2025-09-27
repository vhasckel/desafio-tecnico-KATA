const express = require("express");
const carrinhoRoutes = require("./modules/carrinho/routes");
const produtoRoutes = require("./modules/produto/routes");

const router = express.Router();

// Rotas da API
router.use("/api/carrinho", carrinhoRoutes);
router.use("/api/produtos", produtoRoutes);

// Rota de documentação da API
router.get("/", (req, res) => {
  res.json({
    message: "API do Sistema de E-commerce",
    version: "1.0.0",
    endpoints: {
      produtos: "/api/produtos",
      carrinho: "/api/carrinho",
    },
  });
});

module.exports = router;
