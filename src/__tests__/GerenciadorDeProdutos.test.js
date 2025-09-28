const GerenciadorDeProdutos = require("../modules/produto/services");
const { pool } = require("../config/database");

jest.mock("../config/database");

describe("GerenciadorDeProdutos", () => {
  let service;

  beforeEach(() => {
    service = new GerenciadorDeProdutos();
    pool.query.mockClear();
  });

  describe("criarProduto", () => {
    describe("criarProduto", () => {
      it("deve criar um novo produto com sucesso", async () => {
        const dadosProdutos = {
          nome: "  Notebook Gamer  ",
          preco: 7500.5,
          categoria: "Eletrônicos",
        };

        const dataRetornadaDoDB = {
          id: 1,
          name: "Notebook Gamer",
          price_cents: 750050,
          category: "Eletrônicos",
          created_at: new Date(),
          updated_at: new Date(),
        };

        pool.query.mockResolvedValueOnce({ rows: [dataRetornadaDoDB] });

        const produtoCriado = await service.criarProduto(dadosProdutos);

        expect(pool.query).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO products"),
          ["Notebook Gamer", 750050, "Eletrônicos"]
        );

        expect(produtoCriado).toHaveProperty("id", 1);
        expect(produtoCriado).toHaveProperty("nome", "Notebook Gamer");
        expect(produtoCriado).toHaveProperty("preco", 7500.5);
      });

      it("deve lançar um erro ao tentar criar um produto com nome duplicado", async () => {
        const dadosProdutos = { nome: "Produto Existente", preco: 100 };

        const dbError = new Error(
          "duplicate key value violates unique constraint"
        );
        dbError.code = "23505";
        pool.query.mockRejectedValueOnce(dbError);

        await expect(service.criarProduto(dadosProdutos)).rejects.toThrow(
          "Produto com este nome já existe."
        );
      });

      test.each([
        [
          { nome: "Produto", preco: 0 },
          "Preço deve ser um número maior que zero.",
        ],
        [
          { nome: "Produto", preco: -10 },
          "Preço deve ser um número maior que zero.",
        ],
        [
          { nome: "Produto", preco: "abc" },
          "Preço deve ser um número maior que zero.",
        ],
        [
          { nome: "", preco: 50 },
          "Dados do produto incompletos. Nome e preço são obrigatórios.",
        ],
        [
          { preco: 50 },
          "Dados do produto incompletos. Nome e preço são obrigatórios.",
        ],
      ])(
        "deve lançar erro para dados inválidos: %p",
        async (dados, mensagemDeErro) => {
          await expect(service.criarProduto(dados)).rejects.toThrow(
            mensagemDeErro
          );
        }
      );
    });
  });

  describe("listarProdutos", () => {
    describe("listarProdutos", () => {
      it("deve retornar uma lista de produtos formatada corretamente", async () => {
        const produtosDoDB = [
          { id: 1, name: "Produto A", price_cents: 1000, category: "Cat 1" },
          { id: 2, name: "Produto B", price_cents: 2550, category: "Cat 2" },
        ];
        pool.query.mockResolvedValueOnce({ rows: produtosDoDB });

        const resultado = await service.listarProdutos();

        expect(resultado).toHaveLength(2);
        expect(resultado[0]).toEqual({
          id: 1,
          nome: "Produto A",
          preco: 10.0,
          categoria: "Cat 1",
        });
        expect(resultado[1]).toEqual({
          id: 2,
          nome: "Produto B",
          preco: 25.5,
          categoria: "Cat 2",
        });
      });

      it("deve retornar uma lista vazia quando não houver produtos", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const resultado = await service.listarProdutos();

        expect(resultado).toEqual([]);
      });
    });
  });

  describe("buscarProdutoPorId", () => {
    describe("buscarProdutoPorId", () => {
      it("deve retornar um produto quando o ID existe", async () => {
        const produtoDoDB = {
          id: 1,
          name: "Produto Encontrado",
          price_cents: 9999,
          category: "Busca",
        };
        pool.query.mockResolvedValueOnce({ rows: [produtoDoDB] });

        const resultado = await service.buscarProdutoPorId(1);

        expect(pool.query).toHaveBeenCalledWith(expect.any(String), [1]);
        expect(resultado).toEqual({
          id: 1,
          nome: "Produto Encontrado",
          preco: 99.99,
          categoria: "Busca",
        });
      });

      it("deve retornar null quando o ID não existe", async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const resultado = await service.buscarProdutoPorId(999);

        expect(resultado).toBeNull();
      });

      it("deve lançar um erro para um ID inválido", async () => {
        await expect(service.buscarProdutoPorId("id-invalido")).rejects.toThrow(
          "ID do produto deve ser um número válido maior que zero."
        );
      });
    });
  });
});
