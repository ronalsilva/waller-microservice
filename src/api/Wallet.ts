import { FastifyInstance, RouteHandlerMethod } from "fastify";
import { createWalletSchema, depositMoneySchema, transferMoneySchema, getMoneyTransactionsSchema } from "@schemas/Wallet";
import { createWalletController, depositMoneyController, transferMoneyController, getMoneyTransactionsController } from "@controllers/Wallet";
import { authenticateClientJWT } from "@middleware/authenticateClientJWT";

async function walletRoutes(fastify: FastifyInstance) {
    fastify.post("/create", { schema: createWalletSchema, preHandler: authenticateClientJWT }, createWalletController as RouteHandlerMethod);
    fastify.post("/deposit", { schema: depositMoneySchema, preHandler: authenticateClientJWT }, depositMoneyController as RouteHandlerMethod);
    fastify.post("/transfer", { schema: transferMoneySchema, preHandler: authenticateClientJWT }, transferMoneyController as RouteHandlerMethod);
    
    // fastify.get("/balance", { schema: getMoneyBalanceSchema, preHandler: authenticateClientJWT }, getMoneyBalanceController);
    // fastify.get("/history", { schema: getMoneyHistorySchema, preHandler: authenticateClientJWT }, getMoneyHistoryController);
    fastify.get("/transactions", { schema: getMoneyTransactionsSchema, preHandler: authenticateClientJWT }, getMoneyTransactionsController as RouteHandlerMethod);
}

export default walletRoutes;