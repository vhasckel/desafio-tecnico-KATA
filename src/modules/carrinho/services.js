const CarrinhoRepository = require("./repository");

class CarrinhoService {
  constructor(servicoProduto, idUsuario) {
    this.servicoProduto = servicoProduto;
    this.idUsuario = idUsuario;
    this.repositorio = new CarrinhoRepository();
  }

  async _obterOuCriarCarrinho() {
    try {
      let carrinho = await this.repositorio.buscarCarrinhoAtivoPorIdUsuario(
        this.idUsuario
      );

      if (!carrinho) {
        carrinho = await this.repositorio.criarCarrinho(this.idUsuario);
      }

      return carrinho.id;
    } catch (erro) {
      throw new Error(`Erro ao obter ou criar carrinho: ${erro.message}`);
    }
  }

  async _atualizarTotaisDoCarrinho(idCarrinho) {
    try {
      await this.repositorio.atualizarTotaisCarrinho(idCarrinho);
    } catch (erro) {
      throw new Error(`Erro ao atualizar totais do carrinho: ${erro.message}`);
    }
  }

  async adicionarProduto(produto, quantidade = 1) {
    try {
      if (!produto || typeof produto.id === "undefined") {
        throw new Error("Produto inválido. É necessário um 'id'.");
      }

      const qtd = Number(quantidade);
      if (isNaN(qtd) || qtd <= 0) {
        throw new Error("A quantidade do produto precisa ser maior que zero.");
      }
      const idCarrinho = await this._obterOuCriarCarrinho();

      const produtoEncontrado = await this.repositorio.buscarProdutoPorId(
        produto.id
      );
      if (!produtoEncontrado) {
        throw new Error(`Produto ${produto.id} não encontrado.`);
      }

      const precoUnitarioCentavos = produtoEncontrado.price_cents;
      const precoTotalCentavos = precoUnitarioCentavos * qtd;

      await this.repositorio.inserirOuAtualizarItemCarrinho(
        idCarrinho,
        produto.id,
        qtd,
        precoUnitarioCentavos,
        precoTotalCentavos
      );

      await this._atualizarTotaisDoCarrinho(idCarrinho);
      return await this.listarProdutos();
    } catch (erro) {
      throw new Error(`Erro ao adicionar produto: ${erro.message}`);
    }
  }

  async listarProdutos() {
    try {
      const idCarrinho = await this._obterOuCriarCarrinho();
      return await this.repositorio.buscarItensCarrinhoComProdutos(idCarrinho);
    } catch (erro) {
      throw new Error(`Erro ao listar produtos do carrinho: ${erro.message}`);
    }
  }

  async calcularTotal() {
    try {
      const idCarrinho = await this._obterOuCriarCarrinho();
      const totais = await this.repositorio.buscarTotaisCarrinho(idCarrinho);
      return totais ? totais.total_cents / 100.0 : 0;
    } catch (erro) {
      throw new Error(`Erro ao calcular total: ${erro.message}`);
    }
  }

  async calcularSubtotal() {
    try {
      const idCarrinho = await this._obterOuCriarCarrinho();
      const totais = await this.repositorio.buscarTotaisCarrinho(idCarrinho);
      return totais ? totais.subtotal_cents / 100.0 : 0;
    } catch (erro) {
      throw new Error(`Erro ao calcular subtotal: ${erro.message}`);
    }
  }

  async removerProduto(idProduto) {
    try {
      const id = Number(idProduto);
      if (isNaN(id) || id <= 0) {
        throw new Error(
          "ID do produto deve ser um número válido maior que zero."
        );
      }
      const idCarrinho = await this._obterOuCriarCarrinho();
      const removido = await this.repositorio.deletarItemCarrinho(
        idCarrinho,
        id
      );

      if (!removido) {
        throw new Error(`Produto com ID ${id} não foi encontrado no carrinho.`);
      }

      await this._atualizarTotaisDoCarrinho(idCarrinho);
      return await this.listarProdutos();
    } catch (erro) {
      throw new Error(`Erro ao remover produto: ${erro.message}`);
    }
  }

  async alterarQuantidade(idProduto, novaQuantidade) {
    try {
      const id = Number(idProduto);
      const qtd = Number(novaQuantidade);

      if (isNaN(id) || id <= 0) {
        throw new Error(
          "ID do produto deve ser um número válido maior que zero."
        );
      }

      if (qtd <= 0) {
        return await this.removerProduto(id);
      }
      const idCarrinho = await this._obterOuCriarCarrinho();
      const item = await this.repositorio.buscarItemCarrinhoComPreco(
        idCarrinho,
        id
      );

      if (!item) {
        throw new Error(`Produto com ID ${id} não foi encontrado no carrinho.`);
      }

      await this.repositorio.atualizarQuantidadeItemCarrinho(
        item.id,
        qtd,
        item.unit_price_cents * qtd
      );

      await this._atualizarTotaisDoCarrinho(idCarrinho);
      return await this.listarProdutos();
    } catch (erro) {
      throw new Error(`Erro ao alterar quantidade do produto: ${erro.message}`);
    }
  }

  async aplicarCupom(codigoCupom) {
    try {
      if (!codigoCupom || typeof codigoCupom !== "string") {
        throw new Error("Código do cupom é obrigatório.");
      }
      const idCarrinho = await this._obterOuCriarCarrinho();

      const resultado = await this.repositorio.buscarCupomECalcularDesconto(
        codigoCupom,
        idCarrinho
      );

      if (!resultado) {
        throw new Error("Cupom não encontrado.");
      }

      if (resultado.status !== "valido") {
        if (resultado.status === "valor_minimo") {
          const valorMinimo = (resultado.min_amount_cents / 100).toFixed(2);
          throw new Error(
            `O valor mínimo para usar o cupom ${resultado.code} é de R$ ${valorMinimo}.`
          );
        }
        throw new Error("Cupom inválido, expirado ou não encontrado.");
      }

      await this.repositorio.aplicarDesconto(
        idCarrinho,
        resultado.valor_desconto
      );
      await this._atualizarTotaisDoCarrinho(idCarrinho);

      console.log(`Cupom "${codigoCupom}" aplicado com sucesso!`);
      return await this.resumoDaCompra();
    } catch (erro) {
      throw new Error(erro.message || `Erro ao aplicar cupom.`);
    }
  }

  async resumoDaCompra() {
    try {
      const idCarrinho = await this._obterOuCriarCarrinho();
      const resumo = await this.repositorio.buscarResumoCarrinho(idCarrinho);

      if (!resumo) {
        return {
          subtotal: 0,
          cupom: "Nenhum",
          desconto: 0,
          frete: 50,
          total: 50,
        };
      }

      return resumo;
    } catch (erro) {
      throw new Error(`Erro ao gerar resumo da compra: ${erro.message}`);
    }
  }
}

module.exports = CarrinhoService;
