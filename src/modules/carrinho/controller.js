const CarrinhoCompras = require("./services");

const getUserId = (req) => req.headers["x-user-id"] || "default";

const listarProdutos = async (req, res) => {
  try {
    const carrinhoService = new CarrinhoCompras(getUserId(req));
    const produtos = await carrinhoService.listarProdutos();
    const total = await carrinhoService.calcularTotal();

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

const adicionarProduto = async (req, res) => {
  try {
    const { produto, quantidade } = req.body;

    if (!produto || typeof produto.id === "undefined") {
      return res.status(400).json({
        mensagem:
          "Dados do produto inválidos. 'produto' com 'id' é obrigatório.",
      });
    }

    const carrinhoService = new CarrinhoCompras(getUserId(req));
    const carrinhoAtualizado = await carrinhoService.adicionarProduto(
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

const removerProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const produtoId = parseInt(id, 10);

    if (isNaN(produtoId)) {
      return res
        .status(400)
        .json({ mensagem: "O ID do produto deve ser um número." });
    }

    const carrinhoService = new CarrinhoCompras(getUserId(req));
    const carrinhoAtualizado = await carrinhoService.removerProduto(produtoId);

    return res.status(200).json({
      mensagem: `Produto com ID ${produtoId} removido com sucesso.`,
      carrinho: carrinhoAtualizado,
    });
  } catch (error) {
    return res.status(404).json({ mensagem: error.message });
  }
};

const aplicarCupom = async (req, res) => {
  try {
    const { codigoCupom } = req.body;

    if (!codigoCupom) {
      return res.status(400).json({
        mensagem: "Código do cupom é obrigatório.",
      });
    }

    const carrinhoService = new CarrinhoCompras(getUserId(req));
    const resumo = await carrinhoService.aplicarCupom(codigoCupom);

    return res.status(200).json({
      mensagem: `Cupom "${codigoCupom}" aplicado com sucesso!`,
      resumo: resumo,
    });
  } catch (error) {
    return res.status(400).json({ mensagem: error.message });
  }
};

const resumoDaCompra = async (req, res) => {
  try {
    const carrinhoService = new CarrinhoCompras(getUserId(req));
    const resumo = await carrinhoService.resumoDaCompra();

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
