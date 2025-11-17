# Wallet Microservice

Microservico de gerenciamento de carteiras digitais. API RESTful construida com Fastify, TypeScript e Prisma, oferecendo gerenciamento completo de carteiras, transacoes financeiras (credito, debito, transferencias, depositos e saques) e autenticaco via JWT.

## Tecnologias

- **Runtime**: Node.js
- **Framework**: Fastify
- **Linguagem**: TypeScript
- **Mensageria**: Kafka
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (JSON Web Tokens)
- **Documentação**: Swagger/OpenAPI
- **Testes**: Jest
- **Containerização**: Docker

## Funcionalidades

- ✅ Gerenciamento de carteiras digitaIs (wallets)
- ✅ Controle de saldo por usuario
- ✅ Transacoes financeiras (credito, debito, transferencias, depositos e saques)
- ✅ Historico completo de transacoes
- ✅ Autenticacao e autorizacao via JWT
- ✅ Documentacao interativa com Swagger UI
- ✅ Validacao de schemas com Fastify
- ✅ CORS configurado
- ✅ Estrutura modular e escalavel
- ✅ Testes automatizados com cobertura

## Pre-requisitos

Antes de comecar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Prisma CLI](https://www.prisma.io/docs/concepts/components/prisma-cli) (instalado via npm)

## Instalacao

1. **Clone o repositorio** (se ainda nao tiver feito):
```bash
git clone <repository-url>
cd waller-microservice
```

2. **Instale as dependencias**:
```bash
npm install
```

3. **Configure as variaveis de ambiente**:
Crie um arquivo `.env` na raiz do projeto com as seguintes variaveis:

```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/wallet-db-ilia"
JWT_SECRET = "ILIACHALLENGE"
PORT= 3001
KAFKA_BROKER=localhost:9092
```

4. **Inicie o banco de dados com Docker**:
```bash
docker-compose up -d
```

5. **Configure o banco de dados com Prisma**:
```bash
npx prisma db push
npx prisma generate
```

Ou use o script npm:
```bash
npm run db
```

## Kafka

- Integracao com `client-microservice` via Kafka para autenticacao e obtencao de dados do usuario.
- Producer e consumer implementados com Kafka.
- Ao subir com `docker-compose`, serao iniciados: PostgreSQL, Zookeeper e Kafka.

### IMPORTANTE 

Poderia usar o security -> protocol, ssl -> keystore, ssl -> protocol, protocolos do Kafka para configurar SSL, mas iria fica mais complexo e sei minhas limitacoes, nao queria perder tempo aprendendo e tentando configurar isso agora, essa e a primeira fez que trabalho com Kafka.

### Variaveis de ambiente

- `KAFKA_BROKER` (ex.: `localhost:9092`) — endereco do broker Kafka

### Topicos

- `client-microservice-requests` — envio de requisicoes ao `client-microservice`
  - Acoes:
    - `validateTokenAndGetUser` — valida token e retorna dados do usuario
    - `getUserById` — busca usuario por ID
- `client-microservice-responses` — recebimento de respostas do `client-microservice`
  - Formato esperado: `{ correlationId: string, user?: {...}, error?: string, message?: string }`

### Fluxo resumido

- O middleware `autheticateClientJWT` extrai o token do header `Authorization` e o envia via Kafka (acao `validateTokenAndGetUser`).
- O consumer aguarda a resposta no topico de `responses` e preenche `request.clientUser`.
- Quando necessario obter dados por ID, o servico `userService` publica `getUserById` e aguarda a resposta correlacionada.

Mais detalhes em `src/middleware/README.md`.

## Executando o Projeto

### Modo Desenvolvimento
```bash
npm run dev
```

Ou:
F5

O servidor estara disponível em `http://localhost:3002`

### Modo Producao
```bash
npm run build
npm run start
```

## Documentacao da API

Apos iniciar o servidor, acesse a documentacao no Swagger:

**http://localhost:3002/docs**

A documentacao inclui:
- Todos os endpoints disponiveis
- Schemas de requisicao e resposta
- Exemplos de uso
- Autenticacao JWT

## Testes

Execute os testes com cobertura:
```bash
npm run test
```

### CI/CD

O projeto esta configurado com **GitHub Actions** para executar os testes unitarios automaticamente em cada push e pull request. O workflow roda os testes com cobertura e garante que o codigo esteja funcionando corretamente antes de ser mesclado.

## Estrutura do Projeto

```
waller-microservice/
├── src/
│   ├── api/              # Definição das rotas
│   ├── controllers/      # Lógica de controle
│   ├── middleware/      
│   │   └── kafka         #configuracao e funcoes do kafka
│   ├── schemas/          # Schemas de validação
│   ├── service/          # Lógica de negócio
│   ├── utils/            # Utilitários
│   ├── test/             # Testes
│   ├── app.ts            # Ponto de entrada
│   └── server.ts         # Configuração do servidor
├── prisma/
│   └── schema.prisma     # Schema do banco de dados (wallets, transações, histórico)
├── docker-compose.yml    # Configuração Docker
├── jest.config.js        # Configuração Jest
├── tsconfig.json         # Configuração TypeScript
└── package.json          # Dependências do projeto
```

## Docker

### Iniciar infraestrutura (DB, Zookeeper e Kafka)

Docker composer ja esta configurado.

```bash
docker-compose up -d
```

## Seguranca

- Senhas sao hasheadas antes de serem armazenadas
- Autenticacao baseada em JWT
- Validacao de schemas em todas as rotas
- CORS configurado para controle de acesso
- Transacaes financeiras com controle de saldo e validacaes

## Scripts Disponiveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm start` - Inicia o servidor em modo produção
- `npm run build` - Compila o TypeScript
- `npm test` - Executa os testes
- `npm run db` - Executa migrations e gera Prisma Client
- `npm run docker` - Inicia o Docker Compose

## Modelo de Dados

O microserviço gerencia:

- **Carteiras (wallet_ilia)**: Cada usuário possui uma carteira unica com saldo
- **Transacoes (wallet_ilia_transaction)**: Suporta multiplos tipos:
  - `credit`: Credito na carteira
  - `debit`: Debito na carteira
  - `transfer`: Transferencia entre carteiras
  - `deposit`: Deposito
  - `withdrawal`: Saque
- **Historico (wallet_ilia_history)**: Registro completo de todas as transacoes realizadas

## 👤 Autor

**Ronald Junger**

---

**Desenvolvido com ❤️**
