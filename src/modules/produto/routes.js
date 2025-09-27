const produtoController = require("./controller");
const express = require("express");
const router = express.Router();

router.get("/", produtoController.listarProdutos);
router.get("/:id", produtoController.buscarProdutoPorId);
router.post("/", produtoController.criarProduto);

module.exports = router;
