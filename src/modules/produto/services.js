const { pool } = require("../../config/database");

class GerenciadorDeProdutos {
  async criarProduto(dadosProdutos) {
    if (!dadosProdutos.nome || dadosProdutos.preco == null) {
      throw new Error(
        "Dados do produto incompletos. Nome e preço são obrigatórios."
      );
    }

    const preco = Number(dadosProdutos.preco);
    if (isNaN(preco) || preco <= 0) {
      throw new Error("Preço deve ser um número maior que zero.");
    }

    const nome = dadosProdutos.nome.trim();
    const price_cents = Math.round(preco * 100);
    const categoria = dadosProdutos.categoria?.trim() || null;

    try {
      const result = await pool.query(
        `INSERT INTO products (name, price_cents, category)
         VALUES ($1, $2, $3)
         RETURNING id, name, price_cents, category, created_at, updated_at`,
        [nome, price_cents, categoria]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        nome: row.name,
        preco: row.price_cents / 100,
        categoria: row.category,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("Produto com este nome já existe.");
      }
      throw new Error(`Erro ao criar produto: ${error.message}`);
    }
  }

  async listarProdutos() {
    try {
      const { rows } = await pool.query(
        `SELECT id, name, price_cents, category FROM products ORDER BY id`
      );
      return rows.map((r) => ({
        id: r.id,
        nome: r.name,
        preco: r.price_cents / 100,
        categoria: r.category,
      }));
    } catch (error) {
      throw new Error(`Erro ao listar produtos: ${error.message}`);
    }
  }

  async buscarProdutoPorId(produtoId) {
    const id = Number(produtoId);
    if (isNaN(id) || id <= 0) {
      throw new Error(
        "ID do produto deve ser um número válido maior que zero."
      );
    }

    try {
      const { rows } = await pool.query(
        `SELECT id, name, price_cents, category FROM products WHERE id = $1`,
        [id]
      );

      const r = rows[0];
      if (!r) return null;

      return {
        id: r.id,
        nome: r.name,
        preco: r.price_cents / 100,
        categoria: r.category,
      };
    } catch (error) {
      throw new Error(`Erro ao buscar produto: ${error.message}`);
    }
  }
}

module.exports = GerenciadorDeProdutos;
