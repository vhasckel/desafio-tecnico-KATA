const ProdutoRepository = require("./repository");
const { getPool } = require("../../shared/database");

jest.mock("../../shared/database");

describe("ProdutoRepository", () => {
  let repositorio;
  let poolMock;

  beforeEach(() => {
    repositorio = new ProdutoRepository();
    poolMock = {
      query: jest.fn(),
    };
    getPool.mockReturnValue(poolMock);
    jest.clearAllMocks();
  });

  describe("buscarTodos", () => {
    it("deve retornar todos os produtos formatados", async () => {
      const produtosDoDB = [
        { id: 1, name: "Produto A", price_cents: 1000, category: "Cat 1" },
        { id: 2, name: "Produto B", price_cents: 2550, category: "Cat 2" },
      ];

      poolMock.query.mockResolvedValueOnce({ rows: produtosDoDB });

      const resultado = await repositorio.buscarTodos();

      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, name, price_cents, category FROM products ORDER BY id"
        )
      );
      expect(resultado).toEqual([
        {
          id: 1,
          nome: "Produto A",
          preco: 10.0,
          categoria: "Cat 1",
          created_at: undefined,
          updated_at: undefined,
        },
        {
          id: 2,
          nome: "Produto B",
          preco: 25.5,
          categoria: "Cat 2",
          created_at: undefined,
          updated_at: undefined,
        },
      ]);
    });
  });

  describe("buscarPorId", () => {
    it("deve retornar um produto formatado quando encontrado", async () => {
      const produtoDoDB = {
        id: 1,
        name: "Produto Encontrado",
        price_cents: 9999,
        category: "Busca",
      };

      poolMock.query.mockResolvedValueOnce({ rows: [produtoDoDB] });

      const resultado = await repositorio.buscarPorId(1);

      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT id, name, price_cents, category FROM products WHERE id = $1"
        ),
        [1]
      );
      expect(resultado).toEqual({
        id: 1,
        nome: "Produto Encontrado",
        preco: 99.99,
        categoria: "Busca",
        created_at: undefined,
        updated_at: undefined,
      });
    });

    it("deve retornar null quando o produto não for encontrado", async () => {
      poolMock.query.mockResolvedValueOnce({ rows: [] });

      const resultado = await repositorio.buscarPorId(999);

      expect(resultado).toBeNull();
    });
  });

  describe("criar", () => {
    it("deve criar um produto e retornar os dados formatados", async () => {
      const produtoRetornado = {
        id: 1,
        name: "Notebook Gamer",
        price_cents: 750050,
        category: "Eletrônicos",
        created_at: new Date(),
        updated_at: new Date(),
      };

      poolMock.query.mockResolvedValueOnce({ rows: [produtoRetornado] });

      const resultado = await repositorio.criar(
        "Notebook Gamer",
        750050,
        "Eletrônicos"
      );

      expect(poolMock.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO products"),
        ["Notebook Gamer", 750050, "Eletrônicos"]
      );
      expect(resultado).toEqual({
        id: 1,
        nome: "Notebook Gamer",
        preco: 7500.5,
        categoria: "Eletrônicos",
        created_at: produtoRetornado.created_at,
        updated_at: produtoRetornado.updated_at,
      });
    });
  });
});
