import { FastifyInstance, RouteHandlerMethod } from "fastify";
import { createWalletSchema, depositMoneySchema, transferMoneySchema, getMoneyTransactionsSchema } from "@schemas/Wallet";
import { createWalletController, depositMoneyController, transferMoneyController, getMoneyTransactionsController } from "@controllers/Wallet";
import { autheticateClientJWT } from "@middleware/authenticateClientJWT";

async function walletRoutes(fastify: FastifyInstance) {
    fastify.post("/create", { schema: createWalletSchema, preHandler: autheticateClientJWT }, createWalletController as RouteHandlerMethod);
    fastify.post("/deposit", { schema: depositMoneySchema, preHandler: autheticateClientJWT }, depositMoneyController as RouteHandlerMethod);
    fastify.post("/transfer", { schema: transferMoneySchema, preHandler: autheticateClientJWT }, transferMoneyController as RouteHandlerMethod);
    fastify.get("/transactions", { schema: getMoneyTransactionsSchema, preHandler: autheticateClientJWT }, getMoneyTransactionsController as RouteHandlerMethod);
}

export default walletRoutes;