import { FastifyRequest, FastifyReply } from "fastify";
import { getUserBalance } from "@service/Users";
import { getUserByIdFromClientService } from "@middleware/kafka/userService";

export async function getUserBalanceController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    if (!request.clientUser) {
        return response.status(401).send({ error: "Unauthorized", message: "Token de autenticação inválido ou expirado" });
    }

    const userId = request.clientUser.id;
    const userFromClient = await getUserByIdFromClientService(userId);

    if (!userFromClient) {
        return response.status(404).send({ error: "Usuário não encontrado", message: "Usuário não encontrado no client-microservice" });
    }

    const wallet = await getUserBalance(response, userId);

    if (!wallet) {
        return response.status(404).send({ error: "Carteira não encontrada" });
    }

    return response.code(200).send(wallet);
}