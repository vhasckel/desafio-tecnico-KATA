const ProdutoService = require("./services");
const ProdutoRepository = require("./repository");

jest.mock("./repository");

describe("ProdutoService", () => {
  let servicoProduto;
  let repositorioMock;

  beforeEach(() => {
    repositorioMock = new ProdutoRepository();
    servicoProduto = new ProdutoService();
    servicoProduto.repositorio = repositorioMock;
    jest.clearAllMocks();
  });

  describe("criarProduto", () => {
    it("deve criar um novo produto com sucesso", async () => {
      const dadosProdutos = {
        nome: "  Notebook Gamer  ",
        preco: 7500.5,
        categoria: "Eletrônicos",
      };

      const produtoRetornado = {
        id: 1,
        nome: "Notebook Gamer",
        preco: 7500.5,
        categoria: "Eletrônicos",
        created_at: new Date(),
        updated_at: new Date(),
      };

      repositorioMock.criar.mockResolvedValueOnce(produtoRetornado);

      const produtoCriado = await servicoProduto.criarProduto(dadosProdutos);

      expect(repositorioMock.criar).toHaveBeenCalledWith(
        "Notebook Gamer",
        750050,
        "Eletrônicos"
      );

      expect(produtoCriado).toEqual(produtoRetornado);
    });

    it("deve lançar um erro ao tentar criar um produto com nome duplicado", async () => {
      const dadosProdutos = { nome: "Produto Existente", preco: 100 };

      const dbError = new Error(
        "duplicate key value violates unique constraint"
      );
      dbError.code = "23505";
      repositorioMock.criar.mockRejectedValueOnce(dbError);

      await expect(servicoProduto.criarProduto(dadosProdutos)).rejects.toThrow(
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
        await expect(servicoProduto.criarProduto(dados)).rejects.toThrow(
          mensagemDeErro
        );
      }
    );
  });

  describe("listarProdutos", () => {
    it("deve retornar uma lista de produtos formatada corretamente", async () => {
      const produtosFormatados = [
        { id: 1, nome: "Produto A", preco: 10.0, categoria: "Cat 1" },
        { id: 2, nome: "Produto B", preco: 25.5, categoria: "Cat 2" },
      ];

      repositorioMock.buscarTodos.mockResolvedValueOnce(produtosFormatados);

      const resultado = await servicoProduto.listarProdutos();

      expect(repositorioMock.buscarTodos).toHaveBeenCalled();
      expect(resultado).toEqual(produtosFormatados);
    });

    it("deve retornar uma lista vazia quando não houver produtos", async () => {
      repositorioMock.buscarTodos.mockResolvedValueOnce([]);

      const resultado = await servicoProduto.listarProdutos();

      expect(resultado).toEqual([]);
    });
  });

  describe("buscarProdutoPorId", () => {
    it("deve retornar um produto quando o ID existe", async () => {
      const produtoFormatado = {
        id: 1,
        nome: "Produto Encontrado",
        preco: 99.99,
        categoria: "Busca",
      };

      repositorioMock.buscarPorId.mockResolvedValueOnce(produtoFormatado);

      const resultado = await servicoProduto.buscarProdutoPorId(1);

      expect(repositorioMock.buscarPorId).toHaveBeenCalledWith(1);
      expect(resultado).toEqual(produtoFormatado);
    });

    it("deve retornar null quando o ID não existe", async () => {
      repositorioMock.buscarPorId.mockResolvedValueOnce(null);

      const resultado = await servicoProduto.buscarProdutoPorId(999);

      expect(resultado).toBeNull();
    });

    it("deve lançar um erro para um ID inválido", async () => {
      await expect(
        servicoProduto.buscarProdutoPorId("id-invalido")
      ).rejects.toThrow(
        "ID do produto deve ser um número válido maior que zero."
      );
    });
  });
});
