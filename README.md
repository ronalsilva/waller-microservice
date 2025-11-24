# Wallet Microservice

Digital wallet management microservice. RESTful API built with Fastify, TypeScript and Prisma, offering complete wallet management, financial transactions (credit, debit, transfers, deposits and withdrawals) and JWT authentication.

## Technologies

- **Runtime**: Node.js
- **Framework**: Fastify
- **Language**: TypeScript
- **Messaging**: Kafka
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Containerization**: Docker

## Features

- ✅ Digital wallet management (wallets)
- ✅ Balance control per user
- ✅ Financial transactions (credit, debit, transfers, deposits and withdrawals)
- ✅ Complete transaction history
- ✅ JWT authentication and authorization
- ✅ Interactive documentation with Swagger UI
- ✅ Schema validation with Fastify
- ✅ CORS configured
- ✅ Modular and scalable structure
- ✅ Automated tests with coverage

## Prerequisites

Before starting, make sure you have installed:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Prisma CLI](https://www.prisma.io/docs/concepts/components/prisma-cli) (installed via npm)

## Installation

1. **Clone the repository** (if you haven't already):
```bash
git clone git@github.com:ronalsilva/waller-microservice.git
cd waller-microservice
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
Create a `.env` file in the project root with the following variables:

```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/wallet-db-ilia"
JWT_SECRET = "ILIACHALLENGE"
PORT= 3001
KAFKA_BROKER=localhost:9092
```

4. **Start the database with Docker**:
```bash
docker-compose up -d
```

5. **Configure the database with Prisma**:
```bash
npx prisma db push
npx prisma generate
```

Or use the npm script:
```bash
npm run db
```

## Kafka

- Integration with `client-microservice` via Kafka for authentication and user data retrieval.
- Producer and consumer implemented with Kafka.
- When starting with `docker-compose`, the following will be started: PostgreSQL, Zookeeper and Kafka.

### IMPORTANT

I could use security -> protocol, ssl -> keystore, ssl -> protocol, Kafka protocols to configure SSL, but it would be more complex and I know my limitations, I didn't want to waste time learning and trying to configure this now, this is the first time I work with Kafka.

### Environment variables

- `KAFKA_BROKER` (e.g.: `localhost:9092`) — Kafka broker address

### Topics

- `client-microservice-requests` — sending requests to `client-microservice`
  - Actions:
    - `validateTokenAndGetUser` — validates token and returns user data
    - `getUserById` — searches user by ID
- `client-microservice-responses` — receiving responses from `client-microservice`
  - Expected format: `{ correlationId: string, user?: {...}, error?: string, message?: string }`

### Summary flow

- The `autheticateClientJWT` middleware extracts the token from the `Authorization` header and sends it via Kafka (action `validateTokenAndGetUser`).
- The consumer waits for the response in the `responses` topic and populates `request.clientUser`.
- When it's necessary to get data by ID, the `userService` publishes `getUserById` and waits for the correlated response.

More details in `src/middleware/README.md`.

## Running the Project

### Development Mode
```bash
npm run dev
```

Or:
F5

The server will be available at `http://localhost:3002`

### Production Mode
```bash
npm run build
npm run start
```

## API Documentation

After starting the server, access the documentation in Swagger:

**http://localhost:3002/docs**

The documentation includes:
- All available endpoints
- Request and response schemas
- Usage examples
- JWT authentication

## Testing

Run tests with coverage:
```bash
npm run test
```

### CI/CD

The project is configured with **GitHub Actions** to automatically run unit tests on each push and pull request. The workflow runs tests with coverage and ensures the code is working correctly before being merged.

## Project Structure

```
waller-microservice/
├── src/
│   ├── api/              # Route definitions
│   ├── controllers/      # Control logic
│   ├── middleware/      
│   │   └── kafka         # Kafka configuration and functions
│   ├── schemas/          # Validation schemas
│   ├── service/          # Business logic
│   ├── utils/            # Utilities
│   ├── test/             # Tests
│   ├── app.ts            # Entry point
│   └── server.ts         # Server configuration
├── prisma/
│   └── schema.prisma     # Database schema (wallets, transactions, history)
├── docker-compose.yml    # Docker configuration
├── jest.config.js        # Jest configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## Docker

### Start infrastructure (DB, Zookeeper and Kafka)

Docker compose is already configured.

```bash
docker-compose up -d
```

## Security

- Passwords are hashed before being stored
- JWT-based authentication
- Schema validation on all routes
- CORS configured for access control
- Financial transactions with balance control and validations

## Available Scripts

- `npm run dev` - Starts the server in development mode
- `npm start` - Starts the server in production mode
- `npm run build` - Compiles TypeScript
- `npm test` - Runs tests
- `npm run db` - Runs migrations and generates Prisma Client
- `npm run docker` - Starts Docker Compose

## Data Model

The microservice manages:

- **Wallets (wallet_ilia)**: Each user has a unique wallet with balance
- **Transactions (wallet_ilia_transaction)**: Supports multiple types:
  - `credit`: Credit to wallet
  - `debit`: Debit from wallet
  - `transfer`: Transfer between wallets
  - `deposit`: Deposit
- **History (wallet_ilia_history)**: Complete record of all transactions performed

## 👤 Author

**Ronald Junger**

---

**Developed with ❤️**
