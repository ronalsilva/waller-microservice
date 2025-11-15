import { FastifyInstance } from "fastify";
import { createWalletSchema, depositMoneySchema, transferMoneySchema } from "@schemas/Wallet";
import { createWalletController, depositMoneyController, transferMoneyController } from "@controllers/Wallet";

async function walletRoutes(fastify: FastifyInstance) {
    fastify.post("/create", { schema: createWalletSchema, preHandler: fastify.authenticate }, createWalletController);
    fastify.post("/deposit", { schema: depositMoneySchema, preHandler: fastify.authenticate }, depositMoneyController);
    // fastify.post("/withdraw", { schema: withdrawMoneySchema, preHandler: fastify.authenticate }, withdrawMoneyController);
    fastify.post("/transfer", { schema: transferMoneySchema, preHandler: fastify.authenticate }, transferMoneyController);
    // fastify.get("/balance", { schema: getMoneyBalanceSchema, preHandler: fastify.authenticate }, getMoneyBalanceController);
    // fastify.get("/history", { schema: getMoneyHistorySchema, preHandler: fastify.authenticate }, getMoneyHistoryController);
    // fastify.get("/transactions", { schema: getMoneyTransactionsSchema, preHandler: fastify.authenticate }, getMoneyTransactionsController);
}

export default walletRoutes;