const CarrinhoCompras = require("./models/CarrinhoCompras.js");

const meuCarrinho = new CarrinhoCompras();
// Adicionar produtos ao carrinho
meuCarrinho.adicionarProduto({ nome: "Notebook", preco: "2000" });
meuCarrinho.adicionarProduto({ nome: "Notebook", preco: "2000" });
meuCarrinho.adicionarProduto({ nome: "Mouse", preco: "50" }, 3);

// Listar produtos
console.log(meuCarrinho.listarProdutos());

// Calcular o total
console.log("Total:", meuCarrinho.calcularTotal());

// Remover produto
// console.log(meuCarrinho.removerProduto('NOTEBOOK'))

// Alterar quantidade
meuCarrinho.alterarQuantidade("mouse", 0);
console.log(meuCarrinho.listarProdutos());
