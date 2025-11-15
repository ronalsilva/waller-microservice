import { FastifyRequest, FastifyReply } from "fastify";
import { getUserBalance } from "@service/Users";

export async function getUserBalanceController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const decoded_data = await request.jwtVerify<{ id: string }>();
    const user = await getUserBalance(response, decoded_data.id);
    return response.code(200).send(user);
}