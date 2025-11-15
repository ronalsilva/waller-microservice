import { loginSchema } from "@schemas/Login";
import { FastifyInstance } from "fastify";
import { loginController } from "@controllers/Login";

async function loginRoutes(fastify: FastifyInstance) {
    fastify.post("", { schema: loginSchema }, loginController);
}

export default loginRoutes;