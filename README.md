## KATA E-commerce API

API REST para gerenciamento de produtos e carrinho de compras, integrada ao PostgreSQL.

### Passos de Instalação e Execução

1. Install dependencies

```bash
npm install
```

2. Setup PostgreSQL database

- Crie o banco e as tabelas usando o arquivo `database.sql`:

```bash
# ajuste usuário/host/porta conforme seu ambiente
psql -h 127.0.0.1 -p 5432 -U postgres -f database.sql
```

3. Configure as variáveis de ambiente
   Crie um arquivo `.env` na raiz com:

```bash
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SUASENHA
DB_DATABASE=kata
PORT=3000
```

4. Rodar o Servidor

```bash
npm run dev
```

5. Acessar a API
   Base URL: `http://localhost:3000`

### Comandos

```bash
# iniciar em dev (nodemon)
npm run dev

# rodar testes (jest)
npm test

# build (se aplicável)
npm run build

# iniciar buildado (se aplicável)
npm start
```

### API Endpoints

Produtos (`/api/produtos`)

- GET `/api/produtos` — Lista produtos
- GET `/api/produtos/:id` — Detalha produto
- POST `/api/produtos` — Cria produto
  - body: `{ "nome": string, "preco": number, "categoria"?: string }`

Carrinho (`/api/carrinho`)

- Header recomendado: `x-user-id: <identificador-do-usuario>`
- GET `/api/carrinho` — Lista itens no carrinho
- POST `/api/carrinho` — Adiciona item
  - body: `{ "produto": { "id": number }, "quantidade": number }`
- DELETE `/api/carrinho/:id` — Remove item (por `product_id`)
- POST `/api/carrinho/cupom` — Aplica cupom
  - body: `{ "codigoCupom": string }`
- GET `/api/carrinho/resumo` — Retorna subtotal, desconto, frete e total

### Tech Stack

- Node.js + Express
- PostgreSQL (`pg`)
- Dotenv
- Jest (testes)
- Nodemon (dev)

### Arquitetura

- `src/main.js` — bootstrap do servidor Express
- `src/routes.js` — roteador raiz
- `src/config/database.js` — conexão com Postgres (Pool)
- `src/modules/produto/` — rotas, controller e service de produtos (persistência no DB)
- `src/modules/carrinho/` — rotas, controller e service do carrinho (carts, cart_items, coupons)
- `src/middlewares/` — middlewares (CORS, erros, 404)

Regras principais:

- Preço é armazenado em centavos no banco (price_cents). A API expõe `preco` em reais.
- Carrinho é por usuário (id via header `x-user-id`).
- Frete padrão é aplicado quando há itens. Frete é zerado se o carrinho estiver vazio e pode ser grátis acima de um limite.
- Cupons são validados e aplicados no banco.

### Exemplos de uso (curl)

- Listar produtos

```bash
curl -s http://localhost:3000/api/produtos | jq
```

- Criar produto

```bash
curl -s -X POST http://localhost:3000/api/produtos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Mouse Logitech","preco":99.9,"categoria":"accessories"}' | jq
```

- Listar carrinho

```bash
curl -s http://localhost:3000/api/carrinho \
  -H "x-user-id: user-123" | jq
```

- Adicionar item ao carrinho

```bash
curl -s -X POST http://localhost:3000/api/carrinho \
  -H "Content-Type: application/json" -H "x-user-id: user-123" \
  -d '{"produto":{"id":1},"quantidade":2}' | jq
```

- Remover item do carrinho

```bash
curl -s -X DELETE http://localhost:3000/api/carrinho/1 \
  -H "x-user-id: user-123" | jq
```

- Aplicar cupom

```bash
curl -s -X POST http://localhost:3000/api/carrinho/cupom \
  -H "Content-Type: application/json" -H "x-user-id: user-123" \
  -d '{"codigoCupom":"WELCOME10"}' | jq
```

- Resumo da compra

```bash
curl -s http://localhost:3000/api/carrinho/resumo \
  -H "x-user-id: user-123" | jq
```

### Como rodar os testes

```bash
npm test
```

Notas de teste:

- Os testes unitários usam `jest` e mocks de `pool.query`.
