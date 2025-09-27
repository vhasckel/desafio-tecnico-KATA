const GerenciadorDeProdutos = require("../produto/services");

const gerenciadorDeProdutos = new GerenciadorDeProdutos();

const criarProduto = async (req, res) => {
  try {
    const dadosProdutos = req.body;

    const novoProduto = gerenciadorDeProdutos.criarProduto(dadosProdutos);

    return res
      .status(201)
      .json({ mensagem: "Produto criado com sucesso.", produto: novoProduto });
  } catch (error) {
    return res.status(400).json({ mensagem: error.message });
  }
};

const listarProdutos = (req, res) => {
  try {
    const todosOsProdutos = gerenciadorDeProdutos.listarProdutos();
    return res.status(200).json(todosOsProdutos);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const buscarProdutoPorId = (req, res) => {
  try {
    const { id } = req.params;
    const produto = gerenciadorDeProdutos.buscarProdutoPorId(id);

    if (!produto) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    return res.status(200).json(produto);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  criarProduto,
  listarProdutos,
  buscarProdutoPorId,
};
