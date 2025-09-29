const carrinhoController = require("./controller");
const express = require("express");
const router = express.Router();

router.get("/", carrinhoController.listarProdutosDoCarrinho);
router.post("/", carrinhoController.adicionarProdutoAoCarrinho);
router.delete("/:id", carrinhoController.removerProdutoDoCarrinho);
router.post("/cupom", carrinhoController.aplicarCupomAoCarrinho);
router.get("/resumo", carrinhoController.resumoDaCompraDoCarrinho);

module.exports = router;
