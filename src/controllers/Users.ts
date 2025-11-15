import { FastifyRequest, FastifyReply } from "fastify";
import { User } from "@prisma/client";
import { createUser, getUser, updateUser, deleteUser } from "@service/Users";

export async function createUserController(request: FastifyRequest<{ Body: User }>, response: FastifyReply): Promise<FastifyReply> {
    const user = request.body;
    const userData = await createUser(response, user);
    return response.send(userData);
}

export async function getUserController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const decoded_data = await request.jwtVerify<{ email: string }>();
    const user = await getUser(response, decoded_data.email) as User;
    return response.send(user);
}

export async function updateUserController(request: FastifyRequest<{ Body: User }>, response: FastifyReply): Promise<FastifyReply> {
    const decoded_data = await request.jwtVerify<{ email: string }>();
    const user = await getUser(response, decoded_data.email) as User;
    if (!user) {
        return response.code(404).send({ error: "User not found" });
    }
    const userData = await updateUser(response, user.email, request.body as Partial<User>); 
    return response.send(userData);
}

export async function deleteUserController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const decoded_data = await request.jwtVerify<{ email: string }>();
    const user = await getUser(response, decoded_data.email) as User;
    if (!user) {
        return response.code(404).send({ error: "User not found" });
    }
    const userData = await deleteUser(response, user.email);
    return response.send(userData);
}