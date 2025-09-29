const ProdutoRepository = require("./repository");

class ProdutoService {
  constructor() {
    this.repositorio = new ProdutoRepository();
  }
  async listarProdutos() {
    try {
      return await this.repositorio.buscarTodos();
    } catch (erro) {
      throw new Error(`Erro ao listar produtos: ${erro.message}`);
    }
  }

  async buscarProdutoPorId(produtoId) {
    const id = Number(produtoId);
    if (isNaN(id) || id <= 0) {
      throw new Error(
        "ID do produto deve ser um número válido maior que zero."
      );
    }

    try {
      return await this.repositorio.buscarPorId(id);
    } catch (erro) {
      throw new Error(`Erro ao buscar produto: ${erro.message}`);
    }
  }

  async criarProduto(dadosProdutos) {
    if (!dadosProdutos.nome || dadosProdutos.preco == null) {
      throw new Error(
        "Dados do produto incompletos. Nome e preço são obrigatórios."
      );
    }

    const preco = Number(dadosProdutos.preco);
    if (isNaN(preco) || preco <= 0) {
      throw new Error("Preço deve ser um número maior que zero.");
    }

    const nome = dadosProdutos.nome.trim();
    const precoCentavos = Math.round(preco * 100);
    const categoria = dadosProdutos.categoria?.trim() || null;

    try {
      return await this.repositorio.criar(nome, precoCentavos, categoria);
    } catch (erro) {
      if (erro.code === "23505") {
        throw new Error("Produto com este nome já existe.");
      }
      throw new Error(`Erro ao criar produto: ${erro.message}`);
    }
  }
}

module.exports = ProdutoService;
