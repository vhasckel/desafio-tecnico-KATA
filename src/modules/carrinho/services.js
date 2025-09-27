const { pool } = require("../../config/database");

const CUSTO_FRETE_PADRAO_CENTAVOS = 5000;
const VALOR_MINIMO_FRETE_GRATIS_CENTAVOS = 50000;

class CarrinhoCompras {
  constructor(idDoUsuario = "default") {
    this.idDoUsuario = idDoUsuario;
  }

  async _obterOuCriarCarrinho() {
    try {
      let { rows } = await pool.query(
        `SELECT id FROM carts WHERE user_id = $1 AND status = 'active'`,
        [this.idDoUsuario]
      );

      if (rows.length === 0) {
        const resultado = await pool.query(
          `INSERT INTO carts (user_id, status, shipping_cents) 
           VALUES ($1, 'active', $2) 
           RETURNING id`,
          [this.idDoUsuario, CUSTO_FRETE_PADRAO_CENTAVOS]
        );
        return resultado.rows[0].id;
      }

      return rows[0].id;
    } catch (erro) {
      throw new Error(`Erro ao obter ou criar carrinho: ${erro.message}`);
    }
  }

  async _atualizarTotaisDoCarrinho(idDoCarrinho) {
    try {
      await pool.query(
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
          idDoCarrinho,
          VALOR_MINIMO_FRETE_GRATIS_CENTAVOS,
          CUSTO_FRETE_PADRAO_CENTAVOS,
        ]
      );
    } catch (erro) {
      throw new Error(`Erro ao atualizar totais do carrinho: ${erro.message}`);
    }
  }

  async adicionarProduto(produto, quantidade = 1) {
    if (!produto || typeof produto.id === "undefined") {
      throw new Error("Produto inválido. É necessário um 'id'.");
    }

    const qtd = Number(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      throw new Error("A quantidade do produto precisa ser maior que zero.");
    }

    try {
      const idDoCarrinho = await this._obterOuCriarCarrinho();

      const { rows: prods } = await pool.query(
        `SELECT id, price_cents FROM products WHERE id = $1`,
        [produto.id]
      );
      if (prods.length === 0) {
        throw new Error(`Produto ${produto.id} não encontrado.`);
      }
      const precoUnitarioCentavos = prods[0].price_cents;

      const { rows } = await pool.query(
        `SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
        [idDoCarrinho, produto.id]
      );

      const precoTotalCentavos = precoUnitarioCentavos * qtd;

      await pool.query(
        `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price_cents, total_price_cents)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (cart_id, product_id) DO UPDATE 
         SET 
           quantity = cart_items.quantity + $3,
           total_price_cents = cart_items.total_price_cents + $5,
           updated_at = CURRENT_TIMESTAMP;`,
        [
          idDoCarrinho,
          produto.id,
          qtd,
          precoUnitarioCentavos,
          precoTotalCentavos,
        ]
      );

      await this._atualizarTotaisDoCarrinho(idDoCarrinho);
      return await this.listarProdutos();
    } catch (erro) {
      throw new Error(`Erro ao adicionar produto: ${erro.message}`);
    }
  }

  async listarProdutos() {
    try {
      const idDoCarrinho = await this._obterOuCriarCarrinho();
      const { rows } = await pool.query(
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
        [idDoCarrinho]
      );

      return rows.map((row) => ({
        id: row.id,
        nome: row.nome,
        preco: parseFloat(row.preco),
        categoria: row.categoria,
        quantidade: row.quantidade,
        total: parseFloat(row.total),
      }));
    } catch (erro) {
      throw new Error(`Erro ao listar produtos do carrinho: ${erro.message}`);
    }
  }

  async calcularTotal() {
    try {
      const idDoCarrinho = await this._obterOuCriarCarrinho();
      const { rows } = await pool.query(
        `SELECT total_cents FROM carts WHERE id = $1`,
        [idDoCarrinho]
      );
      return rows[0] ? rows[0].total_cents / 100.0 : 0;
    } catch (erro) {
      throw new Error(`Erro ao calcular total: ${erro.message}`);
    }
  }

  async calcularSubtotal() {
    try {
      const idDoCarrinho = await this._obterOuCriarCarrinho();
      const { rows } = await pool.query(
        `SELECT subtotal_cents FROM carts WHERE id = $1`,
        [idDoCarrinho]
      );
      return rows[0] ? rows[0].subtotal_cents / 100.0 : 0;
    } catch (erro) {
      throw new Error(`Erro ao calcular subtotal: ${erro.message}`);
    }
  }

  async removerProduto(idDoProduto) {
    const id = Number(idDoProduto);
    if (isNaN(id) || id <= 0) {
      throw new Error(
        "ID do produto deve ser um número válido maior que zero."
      );
    }

    try {
      const idDoCarrinho = await this._obterOuCriarCarrinho();
      const { rowCount } = await pool.query(
        `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
        [idDoCarrinho, id]
      );

      if (rowCount === 0) {
        throw new Error(`Produto com ID ${id} não foi encontrado no carrinho.`);
      }

      await this._atualizarTotaisDoCarrinho(idDoCarrinho);
      return await this.listarProdutos();
    } catch (erro) {
      throw new Error(`Erro ao remover produto: ${erro.message}`);
    }
  }

  async alterarQuantidade(idDoProduto, novaQuantidade) {
    const id = Number(idDoProduto);
    const qtd = Number(novaQuantidade);

    if (isNaN(id) || id <= 0) {
      throw new Error(
        "ID do produto deve ser um número válido maior que zero."
      );
    }

    if (qtd <= 0) {
      return await this.removerProduto(id);
    }

    try {
      const idDoCarrinho = await this._obterOuCriarCarrinho();
      const { rows } = await pool.query(
        `SELECT id, unit_price_cents FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
        [idDoCarrinho, id]
      );

      if (rows.length === 0) {
        throw new Error(`Produto com ID ${id} não foi encontrado no carrinho.`);
      }

      const { id: idDoItem, unit_price_cents: precoUnitarioCentavos } = rows[0];
      await pool.query(
        `UPDATE cart_items 
         SET quantity = $1, total_price_cents = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [qtd, precoUnitarioCentavos * qtd, idDoItem]
      );

      await this._atualizarTotaisDoCarrinho(idDoCarrinho);
      return await this.listarProdutos();
    } catch (erro) {
      throw new Error(`Erro ao alterar quantidade do produto: ${erro.message}`);
    }
  }

  async aplicarCupom(codigoCupom) {
    if (!codigoCupom || typeof codigoCupom !== "string") {
      throw new Error("Código do cupom é obrigatório.");
    }

    try {
      const idDoCarrinho = await this._obterOuCriarCarrinho();

      const { rows } = await pool.query(
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
        ),
        resultado_update AS (
          UPDATE carts
          SET discount_cents = analise.valor_desconto
          FROM analise
          WHERE id = $2 AND analise.status = 'valido'
          RETURNING analise.status
        )
        SELECT status, min_amount_cents, code FROM analise
        WHERE NOT EXISTS (SELECT 1 FROM resultado_update)
        UNION ALL
        SELECT status, 0 as min_amount_cents, '' as code FROM resultado_update;`,
        [codigoCupom.trim().toUpperCase(), idDoCarrinho]
      );

      if (rows.length === 0) {
        throw new Error("Cupom não encontrado.");
      }

      const resultado = rows[0];

      if (resultado.status !== "valido") {
        if (resultado.status === "valor_minimo") {
          const valorMinimo = (resultado.min_amount_cents / 100).toFixed(2);
          throw new Error(
            `O valor mínimo para usar o cupom ${resultado.code} é de R$ ${valorMinimo}.`
          );
        }
        throw new Error("Cupom inválido, expirado ou não encontrado.");
      }

      await this._atualizarTotaisDoCarrinho(idDoCarrinho);

      console.log(`Cupom "${codigoCupom}" aplicado com sucesso!`);
      return await this.resumoDaCompra();
    } catch (erro) {
      throw new Error(erro.message || `Erro ao aplicar cupom.`);
    }
  }

  async resumoDaCompra() {
    try {
      const idDoCarrinho = await this._obterOuCriarCarrinho();
      const { rows } = await pool.query(
        `SELECT subtotal_cents, discount_cents, shipping_cents, total_cents 
         FROM carts WHERE id = $1`,
        [idDoCarrinho]
      );

      if (rows.length === 0) {
        return {
          subtotal: 0,
          cupom: "Nenhum",
          desconto: 0,
          frete: this.custoFrete / 100,
          total: this.custoFrete / 100,
        };
      }

      const carrinho = rows[0];
      return {
        subtotal: carrinho.subtotal_cents / 100,
        cupom: carrinho.discount_cents > 0 ? "Aplicado" : "Nenhum",
        desconto: carrinho.discount_cents / 100,
        frete: carrinho.shipping_cents / 100,
        total: carrinho.total_cents / 100,
      };
    } catch (erro) {
      throw new Error(`Erro ao gerar resumo da compra: ${erro.message}`);
    }
  }
}

module.exports = CarrinhoCompras;
