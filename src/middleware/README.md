# Middleware - Wallet Microservice

Esta pasta contem todo o codigo relacionado ao Kafka e integracao com o client-microservice.

## IMPORTANTE

Essa foi a primeira fez que tive contato com Kafka, qualquer ponto de melhoria/feedback ficarei agradecido

## Estrutura

### Kafka
- `kafka/config.ts` - Configuracao do cliente Kafka
- `kafka/producer.ts` - Producer para enviar mensagens ao client-microservice
- `kafka/consumer.ts` - Consumer para receber respostas do client-microservice
- `kafka/userService.ts` - Servico para buscar dados do usuário via Kafka

### JWT
- `autheticateClientJWT.ts` - Middleware de autenticacao que envia o token JWT para validacao no client-microservice via Kafka

## Como funciona

Toda essa arquitetura foi pensada por mim Ronald :) (pelo meu entendimento), sei que poderia ser feito uma configuracao melhor

1. O middleware `autheticateClientJWT` extrai o token JWT do header `Authorization: Bearer <token>`
2. O token é enviado para o client-microservice via Kafka com a acao `validateTokenAndGetUser`
3. O client-microservice valida o token e retorna os dados do usuario
4. O consumer recebe a resposta e preenche `request.clientUser` com os dados do usuario
5. Quando necessario buscar dados do usuario por ID, o `userService` envia uma mensagem via Kafka

## Variaveis de Ambiente Necessarias

- `KAFKA_BROKER` - Endereco do broker Kafka (padrao: localhost:9092)

## Topicos Kafka

- `client-microservice-requests` - Topico para enviar requisicoes ao client-microservice
  - Acao: `validateTokenAndGetUser` - Valida token e retorna dados do usuario
  - Acao: `getUserById` - Busca usuario por ID
- `client-microservice-responses` - Topico para receber respostas do client-microservice
  - Formato: `{ correlationId: string, user?: {...}, error?: string, message?: string }`

## Formato das Mensagens

### Request (validateTokenAndGetUser)
```json
{
  "action": "validateTokenAndGetUser",
  "token": "eyJhbGci...",
  "correlationId": "uuid",
  "timestamp": "2025-11-15T22:00:00.000Z"
}
```

### Response
```json
{
  "correlationId": "uuid",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

ou em caso de erro:
```json
{
  "correlationId": "uuid",
  "error": "Invalid token",
  "message": "Token expired or invalid"
}
```

