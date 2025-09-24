class CarrinhoCompras {
    constructor() {
        this.produtos = []
    }

    adicionarProduto(produto) {
        this.produtos.push(produto)
    }

    listarProdutos() {
        return this.produtos
    }

    calcularTotal() {
        const total = this.produtos.reduce((soma, produto) => {
            return soma + parseFloat(produto.preco)
        }, 0)

        return total

    }

}

module.exports = CarrinhoCompras