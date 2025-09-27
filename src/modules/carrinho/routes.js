const carrinhoController = require("./controller");
const express = require("express");
const router = express.Router();

router.get("/", carrinhoController.listarProdutos);
router.post("/", carrinhoController.adicionarProduto);
router.delete("/", carrinhoController.removerProduto);
router.post("/cupom", carrinhoController.aplicarCupom);
router.get("/resumo", carrinhoController.resumoDaCompra);

module.exports = router;
