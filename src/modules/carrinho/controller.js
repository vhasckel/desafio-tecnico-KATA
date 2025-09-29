const CarrinhoService = require("./services");
const ProdutoService = require("../produto/services");

const obterIdUsuario = (req) => req.userId || 1;

const listarProdutosDoCarrinho = async (req, res) => {
  try {
    const servicoCarrinho = new CarrinhoService(
      new ProdutoService(),
      obterIdUsuario(req)
    );
    const produtos = await servicoCarrinho.listarProdutos();
    const total = await servicoCarrinho.calcularTotal();

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

const adicionarProdutoAoCarrinho = async (req, res) => {
  try {
    const { produto, quantidade } = req.body;

    if (!produto || typeof produto.id === "undefined") {
      return res.status(400).json({
        mensagem:
          "Dados do produto inválidos. 'produto' com 'id' é obrigatório.",
      });
    }

    const servicoCarrinho = new CarrinhoService(
      new ProdutoService(),
      obterIdUsuario(req)
    );
    const carrinhoAtualizado = await servicoCarrinho.adicionarProduto(
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

const removerProdutoDoCarrinho = async (req, res) => {
  try {
    const { id } = req.params;
    const idProduto = parseInt(id, 10);

    if (isNaN(idProduto)) {
      return res
        .status(400)
        .json({ mensagem: "O ID do produto deve ser um número." });
    }

    const servicoCarrinho = new CarrinhoService(
      new ProdutoService(),
      obterIdUsuario(req)
    );
    const carrinhoAtualizado = await servicoCarrinho.removerProduto(idProduto);

    return res.status(200).json({
      mensagem: `Produto com ID ${idProduto} removido com sucesso.`,
      carrinho: carrinhoAtualizado,
    });
  } catch (error) {
    return res.status(404).json({ mensagem: error.message });
  }
};

const aplicarCupomAoCarrinho = async (req, res) => {
  try {
    const { codigoCupom } = req.body;

    if (!codigoCupom) {
      return res.status(400).json({
        mensagem: "Código do cupom é obrigatório.",
      });
    }

    const servicoCarrinho = new CarrinhoService(
      new ProdutoService(),
      obterIdUsuario(req)
    );
    const resumo = await servicoCarrinho.aplicarCupom(codigoCupom);

    return res.status(200).json({
      mensagem: `Cupom "${codigoCupom}" aplicado com sucesso!`,
      resumo: resumo,
    });
  } catch (error) {
    return res.status(400).json({ mensagem: error.message });
  }
};

const resumoDaCompraDoCarrinho = async (req, res) => {
  try {
    const servicoCarrinho = new CarrinhoService(
      new ProdutoService(),
      obterIdUsuario(req)
    );
    const resumo = await servicoCarrinho.resumoDaCompra();

    return res.status(200).json({
      mensagem: "Resumo da compra gerado com sucesso.",
      resumo: resumo,
    });
  } catch (error) {
    return res.status(500).json({ mensagem: error.message });
  }
};

module.exports = {
  listarProdutosDoCarrinho,
  adicionarProdutoAoCarrinho,
  removerProdutoDoCarrinho,
  aplicarCupomAoCarrinho,
  resumoDaCompraDoCarrinho,
};
