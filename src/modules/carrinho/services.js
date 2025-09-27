class CarrinhoCompras {
  constructor() {
    this.produtos = [];
    this.cupomAplicado = null;
    this.custoFrete = 50;

    this.cuponsDisponiveis = {
      DESCONTO10: {
        tipo: "percentual",
        valor: 10,
        valorMinimo: 1000,
        descricao: "10% de desconto para compras acima de R$ 1000",
      },
      FRETEGRATIS: {
        tipo: "frete",
        valor: "gratis",
        valorMinimo: 500,
        descricao: "Frete grátis para compras acima de R$ 500",
      },
    };
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

  calcularSubtotal() {
    return this.calcularTotal();
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

  aplicarCupom(codigoCupom) {
    const cupom = this.cuponsDisponiveis[codigoCupom];
    const subtotal = this.calcularTotal();

    if (!cupom) {
      throw new Error("Cupom inválido ou não encontrado.");
    }

    if (subtotal < cupom.valorMinimo) {
      throw new Error(
        `O valor mínimo para usar o cupom ${codigoCupom} é de R$ ${cupom.valorMinimo.toFixed(
          2
        )}.`
      );
    }

    this.cupomAplicado = { codigo: codigoCupom, ...cupom };
    console.log(`Cupom "${codigoCupom}" aplicado com sucesso!`);

    return this.resumoDaCompra();
  }

  resumoDaCompra() {
    const subtotal = this.calcularSubtotal();
    let desconto = 0;
    let freteFinal = this.custoFrete;
    let totalFinal = 0;

    if (this.cupomAplicado) {
      const cupom = this.cupomAplicado;
      if (cupom.tipo === "percentual") {
        desconto = subtotal * (cupom.valor / 100);
      } else if (cupom.tipo === "frete") {
        freteFinal = 0;
      }
    }

    totalFinal = subtotal - desconto + freteFinal;

    return {
      subtotal: subtotal,
      cupom: this.cupomAplicado ? this.cupomAplicado.codigo : "Nenhum",
      desconto: desconto,
      frete: freteFinal,
      total: totalFinal,
    };
  }
}

module.exports = CarrinhoCompras;
