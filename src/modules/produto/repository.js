const { getPool } = require("../../shared/database");

class ProdutoRepository {
  _mapearLinha(linha) {
    return {
      id: linha.id,
      nome: linha.name,
      preco: linha.price_cents / 100,
      categoria: linha.category,
      created_at: linha.created_at,
      updated_at: linha.updated_at,
    };
  }

  async buscarTodos() {
    const { rows: linhas } = await getPool().query(
      `SELECT id, name, price_cents, category FROM products ORDER BY id`
    );
    return linhas.map((linha) => this._mapearLinha(linha));
  }

  async buscarPorId(id) {
    const { rows: linhas } = await getPool().query(
      `SELECT id, name, price_cents, category FROM products WHERE id = $1`,
      [id]
    );
    return linhas[0] ? this._mapearLinha(linhas[0]) : null;
  }

  async criar(nome, precoCentavos, categoria) {
    const resultado = await getPool().query(
      `INSERT INTO products (name, price_cents, category)
       VALUES ($1, $2, $3)
       RETURNING id, name, price_cents, category, created_at, updated_at`,
      [nome, precoCentavos, categoria]
    );
    return this._mapearLinha(resultado.rows[0]);
  }
}

module.exports = ProdutoRepository;
