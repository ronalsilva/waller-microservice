import { FastifyInstance } from "fastify";
import { getUserBalanceSchema } from "@schemas/Users"
import { getUserBalanceController } from "@controllers/Users";

async function userRoutes(fastify: FastifyInstance) {
    fastify.get("/balance", { schema: getUserBalanceSchema, preHandler: fastify.authenticate }, getUserBalanceController);
}

export default userRoutes;
