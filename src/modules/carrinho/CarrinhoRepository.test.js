const CarrinhoRepository = require("./repository");
const { getPool } = require("../../shared/database");

jest.mock("../../shared/database");

describe("CarrinhoRepository", () => {
  let repositorio;
  let poolMock;

  beforeEach(() => {
    repositorio = new CarrinhoRepository();
    poolMock = {
      query: jest.fn(),
    };
    getPool.mockReturnValue(poolMock);
    jest.clearAllMocks();
  });

  describe("buscarCarrinhoAtivoPorIdUsuario", () => {
    it("deve retornar carrinho ativo quando encontrado", async () => {
      const carrinhoMock = { id: 1, user_id: "user-123", status: "active" };
      poolMock.query.mockResolvedValueOnce({ rows: [carrinhoMock] });

      const resultado = await repositorio.buscarCarrinhoAtivoPorIdUsuario(
        "user-123"
      );

      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id FROM carts WHERE user_id = $1 AND status = 'active'"
        ),
        ["user-123"]
      );
      expect(resultado).toEqual(carrinhoMock);
    });

    it("deve retornar null quando carrinho não encontrado", async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] });

      const resultado = await repositorio.buscarCarrinhoAtivoPorIdUsuario(
        "user-999"
      );

      expect(resultado).toBeNull();
    });
  });

  describe("criarCarrinho", () => {
    it("deve criar um novo carrinho e retornar os dados", async () => {
      const novoCarrinho = { id: 1, user_id: "user-123", status: "active" };
      poolMock.query.mockResolvedValueOnce({ rows: [novoCarrinho] });

      const resultado = await repositorio.criarCarrinho("user-123");

      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO carts"),
        ["user-123", 5000]
      );
      expect(resultado).toEqual(novoCarrinho);
    });
  });

  describe("buscarProdutoPorId", () => {
    it("deve retornar produto quando encontrado", async () => {
      const produtoMock = { id: 101, price_cents: 2000 };
      poolMock.query.mockResolvedValueOnce({ rows: [produtoMock] });

      const resultado = await repositorio.buscarProdutoPorId(101);

      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, price_cents FROM products WHERE id = $1"
        ),
        [101]
      );
      expect(resultado).toEqual(produtoMock);
    });

    it("deve retornar null quando produto não encontrado", async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] });

      const resultado = await repositorio.buscarProdutoPorId(999);

      expect(resultado).toBeNull();
    });
  });

  describe("inserirOuAtualizarItemCarrinho", () => {
    it("deve executar query de upsert com parâmetros corretos", async () => {
      poolMock.query.mockResolvedValueOnce({ rowCount: 1 });

      await repositorio.inserirOuAtualizarItemCarrinho(1, 101, 2, 2000, 4000);

      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO cart_items"),
        [1, 101, 2, 2000, 4000]
      );
    });
  });

  describe("buscarItensCarrinhoComProdutos", () => {
    it("deve retornar itens do carrinho formatados", async () => {
      const itensMock = [
        {
          id: 101,
          nome: "Produto A",
          preco: "20.00",
          categoria: "Cat1",
          quantidade: 2,
          total: "40.00",
        },
      ];

      poolMock.query.mockResolvedValueOnce({ rows: itensMock });

      const resultado = await repositorio.buscarItensCarrinhoComProdutos(1);

      expect(resultado).toEqual([
        {
          id: 101,
          nome: "Produto A",
          preco: 20.0,
          categoria: "Cat1",
          quantidade: 2,
          total: 40.0,
        },
      ]);
    });
  });

  describe("buscarResumoCarrinho", () => {
    it("deve retornar resumo formatado do carrinho", async () => {
      const resumoMock = {
        subtotal_cents: 5000,
        discount_cents: 500,
        shipping_cents: 0,
        total_cents: 4500,
      };
      poolMock.query.mockResolvedValueOnce({ rows: [resumoMock] });

      const resultado = await repositorio.buscarResumoCarrinho(1);

      expect(resultado).toEqual({
        subtotal: 50.0,
        cupom: "Aplicado",
        desconto: 5.0,
        frete: 0,
        total: 45.0,
      });
    });

    it("deve retornar null quando carrinho não encontrado", async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] });

      const resultado = await repositorio.buscarResumoCarrinho(999);

      expect(resultado).toBeNull();
    });
  });

  describe("deletarItemCarrinho", () => {
    it("deve retornar true quando item foi removido", async () => {
      poolMock.query.mockResolvedValueOnce({ rowCount: 1 });

      const resultado = await repositorio.deletarItemCarrinho(1, 101);

      expect(resultado).toBe(true);
    });

    it("deve retornar false quando nenhum item foi removido", async () => {
      poolMock.query.mockResolvedValueOnce({ rowCount: 0 });

      const resultado = await repositorio.deletarItemCarrinho(1, 999);

      expect(resultado).toBe(false);
    });
  });
});
