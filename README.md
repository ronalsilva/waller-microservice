# Clients Microservice - Ilia Wallet

Microservico de gerenciamento de clientes desenvolvido para a plataforma conecta com o servico de Wallet. API RESTful construida com Fastify, TypeScript e Prisma, oferecendo operacoes CRUD completas para usuarios e autenticacao via JWT.

## Tecnologias

- **Runtime**: Node.js
- **Framework**: Fastify
- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Autenticacao**: JWT (JSON Web Tokens)
- **Documentacao**: Swagger/OpenAPI
- **Testes**: Jest
- **Containerização**: Docker

## Funcionalidades

- ✅ CRUD completo de usuarios
- ✅ Autenticacao e autorizacao via JWT
- ✅ Documentacao interativa com Swagger UI
- ✅ Validacao de schemas com Fastify
- ✅ CORS configurado
- ✅ Estrutura modular e escalavel
- ✅ Testes automatizados com cobertura

## Pre-requisitos

Antes de comecar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versao 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Prisma CLI](https://www.prisma.io/docs/concepts/components/prisma-cli) (instalado via npm)

## Instalacao

1. **Clone o repositorio** (se ainda nao tiver feito):
```bash
git clone <repository-url>
cd clients-microservice
```

2. **Instale as dependencias**:
```bash
npm install
```

3. **Configure as variaveis de ambiente**:
Crie um arquivo `.env` na raiz do projeto com as seguintes variaveis:

```env
DATABASE_URL="postgresql://postgres:admin@localhost:5431/clients-db-ilia"
JWT_SECRET="ILIACHALLENGE"
PORT=3002
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

## Executando o Projeto

### Modo Desenvolvimento
```bash
npm run dev
```

Ou:
F5

O servidor estará disponível em `http://localhost:3002`

### Modo Produção
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

## Estrutura do Projeto

```
clients-microservice/
├── src/
│   ├── api/              # Definicao das rotas
│   ├── controllers/      # Logica de controle
│   ├── schemas/          # Schemas de validacao
│   ├── service/          # Logica de negocio
│   ├── utils/            # Utilitarios
│   ├── test/             # Testes
│   ├── app.ts            # Ponto de entrada
│   └── server.ts         # Configuracao do servidor
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
├── docker-compose.yml    # Configuracao Docker
├── jest.config.js        # Configuracao Jest
├── tsconfig.json         # Configuracao TypeScript
└── package.json          # Dependencias do projeto
```

## Docker

### Iniciar apenas o banco de dados
```bash
docker-compose up -d
```

## Seguranca

- Senhas sao hasheadas antes de serem armazenadas
- Autenticacao baseada em JWT
- Validacao de schemas em todas as rotas
- CORS configurado para controle de acesso

## Scripts Disponiveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm start` - Inicia o servidor em modo produção
- `npm run build` - Compila o TypeScript
- `npm test` - Executa os testes
- `npm run db` - Executa migrations e gera Prisma Client
- `npm run docker` - Inicia o Docker Compose

## 👤 Autor

**Ronald Junger**

---

**Desenvolvido com ❤️**
