const CarrinhoService = require("./services");
const CarrinhoRepository = require("./repository");
const ProdutoService = require("../produto/services");

jest.mock("./repository");
jest.mock("../produto/services");

describe("CarrinhoService", () => {
  let servicoCarrinho;
  let repositorioMock;
  let servicoProdutoMock;
  const idUsuario = "user-123";

  beforeEach(() => {
    repositorioMock = new CarrinhoRepository();
    servicoProdutoMock = new ProdutoService();
    servicoCarrinho = new CarrinhoService(servicoProdutoMock, idUsuario);
    servicoCarrinho.repositorio = repositorioMock;
    jest.clearAllMocks();
  });

  describe("adicionarProduto", () => {
    it("deve adicionar um novo produto ao carrinho com sucesso", async () => {
      const produto = { id: 101 };
      const quantidade = 2;

      repositorioMock.buscarCarrinhoAtivoPorIdUsuario
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1 });
      repositorioMock.criarCarrinho.mockResolvedValueOnce({ id: 1 });
      repositorioMock.buscarProdutoPorId.mockResolvedValueOnce({
        id: 101,
        price_cents: 2000,
      });
      repositorioMock.inserirOuAtualizarItemCarrinho.mockResolvedValueOnce();
      repositorioMock.atualizarTotaisCarrinho.mockResolvedValueOnce();

      const produtosEsperados = [
        {
          id: 101,
          nome: "Produto Teste",
          preco: 20.0,
          categoria: "Teste",
          quantidade: 2,
          total: 40.0,
        },
      ];
      repositorioMock.buscarItensCarrinhoComProdutos.mockResolvedValueOnce(
        produtosEsperados
      );

      const resultado = await servicoCarrinho.adicionarProduto(
        produto,
        quantidade
      );

      expect(resultado).toEqual(produtosEsperados);
    });

    it("deve lançar um erro ao tentar adicionar um produto sem ID", async () => {
      const produtoInvalido = { nome: "Produto Sem ID" };

      await expect(
        servicoCarrinho.adicionarProduto(produtoInvalido, 1)
      ).rejects.toThrow(
        "Erro ao adicionar produto: Produto inválido. É necessário um 'id'."
      );
    });

    it("deve lançar um erro se o produto não for encontrado no banco de dados", async () => {
      const produtoNaoExistente = { id: 999 };

      repositorioMock.buscarCarrinhoAtivoPorIdUsuario.mockResolvedValueOnce({
        id: 1,
      });
      repositorioMock.buscarProdutoPorId.mockResolvedValueOnce(null);

      await expect(
        servicoCarrinho.adicionarProduto(produtoNaoExistente, 1)
      ).rejects.toThrow(
        "Erro ao adicionar produto: Produto 999 não encontrado."
      );
    });
  });

  describe("removerProduto", () => {
    it("deve remover um produto e atualizar os totais", async () => {
      const idProdutoParaRemover = 50;

      repositorioMock.buscarCarrinhoAtivoPorIdUsuario
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 1 });
      repositorioMock.deletarItemCarrinho.mockResolvedValueOnce(true);
      repositorioMock.atualizarTotaisCarrinho.mockResolvedValueOnce();
      repositorioMock.buscarItensCarrinhoComProdutos.mockResolvedValueOnce([]);

      const resultado = await servicoCarrinho.removerProduto(
        idProdutoParaRemover
      );

      expect(resultado).toEqual([]);
    });

    it("deve lançar um erro se o produto não estiver no carrinho", async () => {
      const idProduto = 99;

      repositorioMock.buscarCarrinhoAtivoPorIdUsuario.mockResolvedValueOnce({
        id: 1,
      });
      repositorioMock.deletarItemCarrinho.mockResolvedValueOnce(false);

      await expect(servicoCarrinho.removerProduto(idProduto)).rejects.toThrow(
        `Erro ao remover produto: Produto com ID 99 não foi encontrado no carrinho.`
      );
    });
  });

  describe("aplicarCupom", () => {
    it("deve aplicar um cupom válido com sucesso e retornar o resumo da compra", async () => {
      const codigoCupom = "DESCONTO10";

      repositorioMock.buscarCarrinhoAtivoPorIdUsuario
        .mockResolvedValueOnce({ id: 42 })
        .mockResolvedValueOnce({ id: 42 });
      repositorioMock.buscarCupomECalcularDesconto.mockResolvedValueOnce({
        status: "valido",
        valor_desconto: 6000,
      });
      repositorioMock.aplicarDesconto.mockResolvedValueOnce();
      repositorioMock.atualizarTotaisCarrinho.mockResolvedValueOnce();
      repositorioMock.buscarResumoCarrinho.mockResolvedValueOnce({
        subtotal: 600.0,
        cupom: "Aplicado",
        desconto: 60.0,
        frete: 0,
        total: 540.0,
      });

      const resumo = await servicoCarrinho.aplicarCupom(codigoCupom);

      expect(resumo).toEqual({
        subtotal: 600.0,
        cupom: "Aplicado",
        desconto: 60.0,
        frete: 0,
        total: 540.0,
      });
    });

    it("deve lançar um erro se o cupom não atingir o valor mínimo", async () => {
      const codigoCupom = "MIN500";

      repositorioMock.buscarCarrinhoAtivoPorIdUsuario.mockResolvedValueOnce({
        id: 43,
      });
      repositorioMock.buscarCupomECalcularDesconto.mockResolvedValueOnce({
        status: "valor_minimo",
        min_amount_cents: 50000,
        code: "MIN500",
      });

      await expect(servicoCarrinho.aplicarCupom(codigoCupom)).rejects.toThrow(
        "O valor mínimo para usar o cupom MIN500 é de R$ 500.00."
      );
    });

    it("deve lançar um erro para um cupom inválido, expirado ou não encontrado", async () => {
      const codigoCupom = "CUPOM_FALSO";

      repositorioMock.buscarCarrinhoAtivoPorIdUsuario.mockResolvedValueOnce({
        id: 44,
      });
      repositorioMock.buscarCupomECalcularDesconto.mockResolvedValueOnce({
        status: "invalido",
      });

      await expect(servicoCarrinho.aplicarCupom(codigoCupom)).rejects.toThrow(
        "Cupom inválido, expirado ou não encontrado."
      );
    });

    it("deve lançar um erro se o código do cupom não for fornecido", async () => {
      await expect(servicoCarrinho.aplicarCupom("")).rejects.toThrow(
        "Código do cupom é obrigatório."
      );
      await expect(servicoCarrinho.aplicarCupom(null)).rejects.toThrow(
        "Código do cupom é obrigatório."
      );
    });
  });

  describe("listarProdutos", () => {
    it("deve listar produtos do carrinho", async () => {
      const produtosEsperados = [
        {
          id: 1,
          nome: "Produto 1",
          preco: 10.0,
          categoria: "Cat1",
          quantidade: 2,
          total: 20.0,
        },
      ];

      repositorioMock.buscarCarrinhoAtivoPorIdUsuario.mockResolvedValueOnce({
        id: 1,
      });
      repositorioMock.buscarItensCarrinhoComProdutos.mockResolvedValueOnce(
        produtosEsperados
      );

      const resultado = await servicoCarrinho.listarProdutos();

      expect(resultado).toEqual(produtosEsperados);
    });
  });

  describe("calcularTotal", () => {
    it("deve calcular o total do carrinho", async () => {
      repositorioMock.buscarCarrinhoAtivoPorIdUsuario.mockResolvedValueOnce({
        id: 1,
      });
      repositorioMock.buscarTotaisCarrinho.mockResolvedValueOnce({
        total_cents: 5000,
      });

      const resultado = await servicoCarrinho.calcularTotal();

      expect(resultado).toBe(50.0);
    });
  });
});
