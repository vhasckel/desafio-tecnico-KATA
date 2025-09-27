class CarrinhoCompras {
  constructor() {
    this.produtos = [];
  }

  adicionarProduto(produto, quantidade = 1) {
    if (!produto || typeof produto.id === "undefined") {
      throw new Error("Produto inválido. É necessário um 'id'.");
    }

    if (quantidade <= 0) {
      throw new Error("A quantidade do produto precisa ser maior que zero.");
    }

    const produtoExistente = this.produtos.find(
      (itemNoCarrinho) => itemNoCarrinho.id === produto.id
    );

    if (produtoExistente) {
      produtoExistente.quantidade += quantidade;
    } else {
      this.produtos.push({ ...produto, quantidade: quantidade });
    }
    return this.produtos;
  }

  listarProdutos() {
    return this.produtos;
  }

  calcularTotal() {
    const total = this.produtos.reduce((soma, produto) => {
      return soma + produto.preco * produto.quantidade;
    }, 0);

    return total;
  }

  removerProduto(produtoId) {
    const tamanhoOriginalCarrinho = this.produtos.length;

    this.produtos = this.produtos.filter((produto) => produto.id !== produtoId);

    if (this.produtos.length === tamanhoOriginalCarrinho) {
      throw new Error(
        `Produto com ID ${produtoId} não foi encontrado no carrinho.`
      );
    }
    return this.produtos;
  }

  alterarQuantidade(produtoId, novaQuantidade) {
    const alterarQuantidade = this.produtos.find(
      (produto) => produto.id === produtoId
    );

    if (novaQuantidade <= 0) {
      return this.removerProduto(produtoId);
    }

    if (alterarQuantidade) {
      alterarQuantidade.quantidade = novaQuantidade;
    } else {
      throw new Error(
        `Produto com ID ${produtoId} não foi encontrado no carrinho.`
      );
    }
    return this.produtos;
  }
}

module.exports = CarrinhoCompras;
