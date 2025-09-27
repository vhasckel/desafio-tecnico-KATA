class GerenciadorDeProdutos {
  constructor() {
    this.produtos = [];
  }

  async criarProduto(dadosProdutos) {
    const { v4: uuid } = await import("uuid");
    let id = uuid();

    if (
      !dadosProdutos.nome ||
      !dadosProdutos.preco ||
      typeof dadosProdutos.estoque === "undefined" // Verificação correta
    ) {
      throw new Error(
        "Dados do produto incompletos. Nome, preço e estoque são obrigatórios."
      );
    }

    const novoProduto = {
      id: id,
      ...dadosProdutos,
    };

    this.produtos.push(novoProduto);
    return novoProduto;
  }

  listarProdutos() {
    return this.produtos;
  }

  buscarProdutoPorId(produtoId) {
    return this.produtos.find((produto) => produto.id === produtoId);
  }
}

module.exports = GerenciadorDeProdutos;
