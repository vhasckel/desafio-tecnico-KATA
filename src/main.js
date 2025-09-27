const CarrinhoCompras = require("./modules/carrinho/services.js");
const GerenciadorDeProdutos = require("./modules/produto/services.js");

const meuCarrinho = new CarrinhoCompras();

const catalogo = new GerenciadorDeProdutos();

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

// Testando a classe Produto
(async () => {
  await catalogo.criarProduto({
    nome: "Teclado Mecânico",
    preco: 300,
    estoque: 10,
  });
  await catalogo.criarProduto({
    nome: "Fone de Ouvido Gamer",
    preco: 250,
    estoque: 15,
  });
  await catalogo.criarProduto({
    nome: "Webcam Full HD",
    preco: 150,
    estoque: 5,
  });

  console.log("Produtos disponíveis:", catalogo.listarProdutos());
})();
