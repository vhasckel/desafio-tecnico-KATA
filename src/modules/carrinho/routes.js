const carrinhoController = require("./controller");
const express = require("express");
const router = express.Router();

router.get("/", carrinhoController.listarProdutos);
router.post("/", carrinhoController.adicionarProduto);
router.delete("/", carrinhoController.removerProduto);

module.exports = router;
