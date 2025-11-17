import { FastifyInstance, RouteHandlerMethod } from "fastify";
import { getUserBalanceSchema } from "@schemas/Users"
import { getUserBalanceController } from "@controllers/Users";
import { autheticateClientJWT } from "@middleware/authenticateClientJWT";

async function userRoutes(fastify: FastifyInstance) {
    fastify.get("/balance", { schema: getUserBalanceSchema, preHandler: autheticateClientJWT }, getUserBalanceController);
}

export default userRoutes;
