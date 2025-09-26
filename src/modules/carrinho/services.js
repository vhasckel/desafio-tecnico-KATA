class CarrinhoCompras {
  constructor() {
    this.produtos = [];
  }

  adicionarProduto(produto, quantidade = 1) {
    if (quantidade <= 0) {
      console.log("A quantidade do produto precisa ser maior que zero.");
      return;
    }

    const produtoExistente = this.produtos.find(
      (p) => p.nome.trim().toLowerCase() === produto.nome.trim().toLowerCase()
    );

    if (produtoExistente) {
      produtoExistente.quantidade += quantidade;
      console.log(
        `Adicionado mais ${quantidade} unidade(s) de "${produto.nome}". Quantidade total: ${produtoExistente.quantidade}.`
      );
    } else {
      this.produtos.push({ ...produto, quantidade: quantidade });
      console.log(
        `${quantidade} unidade(s) de "${produto.nome}" adicionada(s) ao carrinho.`
      );
    }
  }

  listarProdutos() {
    return this.produtos;
  }

  calcularTotal() {
    const total = this.produtos.reduce((soma, produto) => {
      return soma + parseFloat(produto.preco);
    }, 0);

    return total;
  }

  removerProduto(nome) {
    const listaAtualizada = this.produtos.filter(
      (produto) => produto.nome.toLowerCase() !== nome.toLowerCase()
    );
    return listaAtualizada;
  }

  alterarQuantidade(nome, novaQuantidade) {
    const produtoParaAlterarQtd = this.produtos.find(
      (p) => p.nome.trim().toLowerCase() === nome.trim().toLowerCase()
    );

    if (produtoParaAlterarQtd) {
      if (novaQuantidade > 0) {
        produtoParaAlterarQtd.quantidade = novaQuantidade;
        console.log(
          `A quantidade de "${produtoParaAlterarQtd.nome}" foi alterada para ${novaQuantidade}.`
        );
      } else {
        this.produtos = this.produtos.filter(
          (produto) => produto.nome.toLowerCase() !== nome.toLowerCase()
        );
        console.log(
          `Produto "${nome}" removido do carrinho pois a quantidade foi definida como zero.`
        );
      }
    } else {
      console.log(`Produto "${nome}" não encontrado no carrinho.`);
    }
  }
}

module.exports = CarrinhoCompras;
