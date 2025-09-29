const { getPool } = require("../../shared/database");

const CUSTO_FRETE_PADRAO_CENTAVOS = 5000;
const VALOR_MINIMO_FRETE_GRATIS_CENTAVOS = 50000;

class CarrinhoRepository {
  async buscarCarrinhoAtivoPorIdUsuario(idUsuario) {
    const { rows: linhas } = await getPool().query(
      `SELECT id FROM carts WHERE user_id = $1 AND status = 'active'`,
      [idUsuario]
    );
    return linhas[0] || null;
  }

  async criarCarrinho(idUsuario) {
    const { rows: linhas } = await getPool().query(
      `INSERT INTO carts (user_id, status, shipping_cents) 
       VALUES ($1, 'active', $2) 
       RETURNING id`,
      [idUsuario, CUSTO_FRETE_PADRAO_CENTAVOS]
    );
    return linhas[0];
  }

  async buscarProdutoPorId(idProduto) {
    const { rows: linhas } = await getPool().query(
      `SELECT id, price_cents FROM products WHERE id = $1`,
      [idProduto]
    );
    return linhas[0] || null;
  }

  async buscarItemCarrinho(idCarrinho, idProduto) {
    const { rows: linhas } = await getPool().query(
      `SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [idCarrinho, idProduto]
    );
    return linhas[0] || null;
  }

  async inserirOuAtualizarItemCarrinho(
    idCarrinho,
    idProduto,
    quantidade,
    precoUnitarioCentavos,
    precoTotalCentavos
  ) {
    await getPool().query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents, total_price_cents)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cart_id, product_id) DO UPDATE 
       SET 
         quantity = cart_items.quantity + $3,
         total_price_cents = cart_items.total_price_cents + $5,
         updated_at = CURRENT_TIMESTAMP`,
      [
        idCarrinho,
        idProduto,
        quantidade,
        precoUnitarioCentavos,
        precoTotalCentavos,
      ]
    );
  }

  async atualizarTotaisCarrinho(idCarrinho) {
    await getPool().query(
      `WITH calc AS (
        SELECT COALESCE(SUM(total_price_cents), 0) AS subtotal
        FROM cart_items
        WHERE cart_id = $1
      )
      UPDATE carts
      SET 
        subtotal_cents = calc.subtotal,
        shipping_cents = CASE 
                           WHEN calc.subtotal > $2 THEN 0 
                           ELSE $3 
                         END,
        discount_cents = CASE 
                           WHEN calc.subtotal = 0 THEN 0 
                           ELSE discount_cents 
                         END,
        total_cents = calc.subtotal 
                      - (CASE WHEN calc.subtotal = 0 THEN 0 ELSE discount_cents END) 
                      + (CASE WHEN calc.subtotal > $2 THEN 0 ELSE $3 END),
        updated_at = CURRENT_TIMESTAMP
      FROM calc
      WHERE id = $1`,
      [
        idCarrinho,
        VALOR_MINIMO_FRETE_GRATIS_CENTAVOS,
        CUSTO_FRETE_PADRAO_CENTAVOS,
      ]
    );
  }

  async buscarItensCarrinhoComProdutos(idCarrinho) {
    const { rows: linhas } = await getPool().query(
      `SELECT ci.product_id as id,
              COALESCE(p.name, '(produto removido)') as nome,
              ci.unit_price_cents / 100.0 as preco,
              p.category as categoria,
              ci.quantity as quantidade,
              ci.total_price_cents / 100.0 as total
       FROM cart_items ci
       LEFT JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1
       ORDER BY ci.created_at`,
      [idCarrinho]
    );
    return linhas.map((linha) => ({
      id: linha.id,
      nome: linha.nome,
      preco: parseFloat(linha.preco),
      categoria: linha.categoria,
      quantidade: linha.quantidade,
      total: parseFloat(linha.total),
    }));
  }

  async buscarTotaisCarrinho(idCarrinho) {
    const { rows: linhas } = await getPool().query(
      `SELECT total_cents, subtotal_cents FROM carts WHERE id = $1`,
      [idCarrinho]
    );
    return linhas[0] || null;
  }

  async deletarItemCarrinho(idCarrinho, idProduto) {
    const { rowCount: linhasAfetadas } = await getPool().query(
      `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [idCarrinho, idProduto]
    );
    return linhasAfetadas > 0;
  }

  async buscarItemCarrinhoComPreco(idCarrinho, idProduto) {
    const { rows: linhas } = await getPool().query(
      `SELECT id, unit_price_cents FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [idCarrinho, idProduto]
    );
    return linhas[0] || null;
  }

  async atualizarQuantidadeItemCarrinho(
    idItem,
    quantidade,
    precoTotalCentavos
  ) {
    await getPool().query(
      `UPDATE cart_items 
       SET quantity = $1, total_price_cents = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [quantidade, precoTotalCentavos, idItem]
    );
  }

  async buscarCupomECalcularDesconto(codigoCupom, idCarrinho) {
    const { rows: linhas } = await getPool().query(
      `WITH cupom AS (
        SELECT * FROM coupons 
        WHERE code = $1 AND active = true 
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ),
      carrinho AS (
        SELECT subtotal_cents FROM carts WHERE id = $2
      ),
      analise AS (
        SELECT
          carrinho.subtotal_cents,
          cupom.code,
          cupom.min_amount_cents,
          CASE
            WHEN cupom.id IS NULL THEN 'invalido'
            WHEN carrinho.subtotal_cents < cupom.min_amount_cents THEN 'valor_minimo'
            ELSE 'valido'
          END as status,
          CASE
            WHEN cupom.id IS NULL OR carrinho.subtotal_cents < cupom.min_amount_cents THEN 0
            WHEN cupom.discount_type = 'percentage' THEN
              LEAST(
                ROUND(carrinho.subtotal_cents * (cupom.discount_value / 100.0)),
                COALESCE(cupom.max_discount_cents, 'Infinity'::numeric)
              )
            WHEN cupom.discount_type = 'fixed' THEN cupom.discount_value
            ELSE 0
          END as valor_desconto
        FROM carrinho, cupom
      )
      SELECT status, min_amount_cents, code, valor_desconto FROM analise`,
      [codigoCupom.trim().toUpperCase(), idCarrinho]
    );
    return linhas[0] || null;
  }

  async aplicarDesconto(idCarrinho, valorDesconto) {
    await getPool().query(
      `UPDATE carts SET discount_cents = $1 WHERE id = $2`,
      [valorDesconto, idCarrinho]
    );
  }

  async buscarResumoCarrinho(idCarrinho) {
    const { rows: linhas } = await getPool().query(
      `SELECT subtotal_cents, discount_cents, shipping_cents, total_cents 
       FROM carts WHERE id = $1`,
      [idCarrinho]
    );
    if (linhas.length === 0) return null;

    const carrinho = linhas[0];
    return {
      subtotal: carrinho.subtotal_cents / 100,
      cupom: carrinho.discount_cents > 0 ? "Aplicado" : "Nenhum",
      desconto: carrinho.discount_cents / 100,
      frete: carrinho.shipping_cents / 100,
      total: carrinho.total_cents / 100,
    };
  }
}

module.exports = CarrinhoRepository;
