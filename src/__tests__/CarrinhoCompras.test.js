const CarrinhoCompras = require("../modules/carrinho/services");
const { pool } = require("../config/database");

jest.mock("../config/database");

describe("CarrinhoCompras", () => {
  beforeEach(() => {
    pool.query.mockClear();
  });

  it("deve ser definido", () => {
    expect(CarrinhoCompras).toBeDefined();
  });

  describe("adicionarProduto", () => {
    it("deve adicionar um novo produto ao carrinho com sucesso", async () => {
      const idDoUsuario = "user-123";
      const carrinho = new CarrinhoCompras(idDoUsuario);
      const produto = { id: 101 };
      const quantidade = 2;

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 101, price_cents: 2000 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 101,
              nome: "Produto Teste",
              preco: 20.0,
              categoria: "Teste",
              quantidade: 2,
              total: 40.0,
            },
          ],
        });

      const resultado = await carrinho.adicionarProduto(produto, quantidade);

      expect(resultado).toEqual([
        {
          id: 101,
          nome: "Produto Teste",
          preco: 20.0,
          categoria: "Teste",
          quantidade: 2,
          total: 40.0,
        },
      ]);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO cart_items"),
        [1, 101, 2, 2000, 4000]
      );
    });
  });

  it("deve lançar um erro ao tentar adicionar um produto sem ID", async () => {
    const carrinho = new CarrinhoCompras("user-123");
    const produtoInvalido = { nome: "Produto Sem ID" };

    await expect(carrinho.adicionarProduto(produtoInvalido, 1)).rejects.toThrow(
      "Erro ao adicionar produto: Produto inválido. É necessário um 'id'."
    );
  });

  it("deve lançar um erro se o produto não for encontrado no banco de dados", async () => {
    const carrinho = new CarrinhoCompras("user-123");
    const produtoNaoExistente = { id: 999 };

    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      carrinho.adicionarProduto(produtoNaoExistente, 1)
    ).rejects.toThrow("Erro ao adicionar produto: Produto 999 não encontrado.");
  });

  describe("removerProduto", () => {
    it("deve remover um produto e atualizar os totais", async () => {
      const carrinho = new CarrinhoCompras("user-123");
      const idDoProdutoParaRemover = 50;

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      const resultado = await carrinho.removerProduto(idDoProdutoParaRemover);

      expect(resultado).toEqual([]);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM cart_items"),
        [1, idDoProdutoParaRemover]
      );
    });

    it("deve lançar um erro se o produto não estiver no carrinho", async () => {
      const carrinho = new CarrinhoCompras("user-123");
      const idDoProduto = 99;

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rowCount: 0 });

      await expect(carrinho.removerProduto(idDoProduto)).rejects.toThrow(
        `Erro ao remover produto: Produto com ID 99 não foi encontrado no carrinho.`
      );
    });
  });

  describe("aplicarCupom", () => {
    it("deve aplicar um cupom válido com sucesso e retornar o resumo da compra", async () => {
      const carrinho = new CarrinhoCompras("user-com-cupom");
      const codigoCupom = "DESCONTO10";

      pool.query;
      pool.query.mockResolvedValueOnce({ rows: [{ id: 42 }] });
      pool.query.mockResolvedValueOnce({ rows: [{ status: "valido" }] });
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 42 }] });
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            subtotal_cents: 60000,
            discount_cents: 6000,
            shipping_cents: 0,
            total_cents: 54000,
          },
        ],
      });

      const resumo = await carrinho.aplicarCupom(codigoCupom);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WITH cupom AS"),
        ["DESCONTO10", 42]
      );

      expect(resumo).toEqual({
        subtotal: 600.0,
        cupom: "Aplicado",
        desconto: 60.0,
        frete: 0,
        total: 540.0,
      });
    });

    it("deve lançar um erro se o cupom não atingir o valor mínimo", async () => {
      const carrinho = new CarrinhoCompras("user-valor-baixo");
      const codigoCupom = "MIN500";

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 43 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              status: "valor_minimo",
              min_amount_cents: 50000,
              code: "MIN500",
            },
          ],
        });

      await expect(carrinho.aplicarCupom(codigoCupom)).rejects.toThrow(
        "O valor mínimo para usar o cupom MIN500 é de R$ 500.00."
      );
    });

    it("deve lançar um erro para um cupom inválido, expirado ou não encontrado", async () => {
      const carrinho = new CarrinhoCompras("user-cupom-invalido");
      const codigoCupom = "CUPOM_FALSO";

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 44 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              status: "invalido",
            },
          ],
        });

      await expect(carrinho.aplicarCupom(codigoCupom)).rejects.toThrow(
        "Cupom inválido, expirado ou não encontrado."
      );
    });

    it("deve lançar um erro se o código do cupom não for fornecido", async () => {
      const carrinho = new CarrinhoCompras("user-sem-cupom");

      await expect(carrinho.aplicarCupom("")).rejects.toThrow(
        "Código do cupom é obrigatório."
      );
      await expect(carrinho.aplicarCupom(null)).rejects.toThrow(
        "Código do cupom é obrigatório."
      );
    });
  });
});
