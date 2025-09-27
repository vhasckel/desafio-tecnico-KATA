const CarrinhoCompras = require("./services");

const carrinhoService = new CarrinhoCompras();

const listarProdutos = (req, res) => {
  try {
    const produtos = carrinhoService.listarProdutos();
    const total = carrinhoService.calcularTotal();

    return res.status(200).json({
      mensagem: "Carrinho recuperado com sucesso.",
      carrinho: {
        produtos,
        total,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

const adicionarProduto = (req, res) => {
  try {
    const { produto, quantidade } = req.body;

    if (!produto || typeof produto.id === "undefined") {
      return res.status(400).json({
        mensagem:
          "Dados do produto inválidos. 'produto' com 'id' é obrigatório.",
      });
    }

    const carrinhoAtualizado = carrinhoService.adicionarProduto(
      produto,
      quantidade
    );

    return res.status(200).json({
      mensagem: `Produto "${produto.nome}" adicionado no carrinho.`,
      carrinho: carrinhoAtualizado,
    });
  } catch (error) {
    return res.status(400).json({ mensagem: error.message });
  }
};

const removerProduto = (req, res) => {
  try {
    const { id } = req.params;
    const produtoId = parseInt(id, 10);

    if (isNaN(produtoId)) {
      return res
        .status(400)
        .json({ mensagem: "O ID do produto deve ser um número." });
    }

    const carrinhoAtualizado = carrinhoService.removerProduto(produtoId);

    return res.status(200).json({
      mensagem: `Produto com ID ${produtoId} removido com sucesso.`,
      carrinho: carrinhoAtualizado,
    });
  } catch (error) {
    return res.status(404).json({ mensagem: error.message });
  }
};

const aplicarCupom = (req, res) => {
  try {
    const { codigoCupom } = req.body;

    if (!codigoCupom) {
      return res.status(400).json({
        mensagem: "Código do cupom é obrigatório.",
      });
    }

    const resumo = carrinhoService.aplicarCupom(codigoCupom);

    return res.status(200).json({
      mensagem: `Cupom "${codigoCupom}" aplicado com sucesso!`,
      resumo: resumo,
    });
  } catch (error) {
    return res.status(400).json({ mensagem: error.message });
  }
};

const resumoDaCompra = (req, res) => {
  try {
    const resumo = carrinhoService.resumoDaCompra();

    return res.status(200).json({
      mensagem: "Resumo da compra gerado com sucesso.",
      resumo: resumo,
    });
  } catch (error) {
    return res.status(500).json({ mensagem: error.message });
  }
};

module.exports = {
  listarProdutos,
  adicionarProduto,
  removerProduto,
  aplicarCupom,
  resumoDaCompra,
};
