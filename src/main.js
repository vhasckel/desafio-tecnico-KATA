const CarrinhoCompras = require("./modules/carrinho/services.js");

const meuCarrinho = new CarrinhoCompras();

// Adicionar produtos ao carrinho
meuCarrinho.adicionarProduto({
  id: "1",
  nome: "Notebook",
  preco: "2000",
});
meuCarrinho.adicionarProduto({
  id: "2",
  nome: "Monitor",
  preco: "500",
});
meuCarrinho.adicionarProduto({
  id: "3",
  nome: "Mouse",
  preco: "50",
});
meuCarrinho.adicionarProduto({
  id: "4",
  nome: "Monitor",
  preco: "500",
});

// Listar produtos
console.log(meuCarrinho.listarProdutos());

// Calcular o total
console.log("Total:", meuCarrinho.calcularTotal());

// Remover produto
console.log(meuCarrinho.removerProduto("2"));

// Alterar quantidade
meuCarrinho.alterarQuantidade("3", 1);

console.log(meuCarrinho.listarProdutos());
