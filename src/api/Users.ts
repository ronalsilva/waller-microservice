import { FastifyInstance, RouteHandlerMethod } from "fastify";
import { getUserBalanceSchema } from "@schemas/Users"
import { getUserBalanceController } from "@controllers/Users";
import { authenticateClientJWT } from "@middleware/authenticateClientJWT";

async function userRoutes(fastify: FastifyInstance) {
    fastify.get("/balance", { schema: getUserBalanceSchema, preHandler: authenticateClientJWT }, getUserBalanceController);
}

export default userRoutes;
