import { User } from "@prisma/client";
import { getUser } from "@service/Users";
import { verifyPassword } from "@utils/hash";
import { FastifyRequest, FastifyReply } from "fastify";

export async function loginController(request: FastifyRequest<{ Body: { email: string; password: string } }>, response: FastifyReply): Promise<FastifyReply> {
    const { email: userEmail, password } = request.body;
    const user = await getUser(response, userEmail);
    if (!user) {
        return response.code(401).send({ error: "User not found" });
    }

    const userData = await getUser(response, userEmail) as User;

    if (!verifyPassword({
        candidatePassword: password,
        salt: userData.salt as string,
        hash: userData.password as string,
    })) {
        return response.code(401).send({ error: "UNAUTHORIZED", message: "Email ou senha incorretos" });
    }

    const {
        email,
        salt,
        id,
    } = userData;

    const accessToken = request.jwt.sign({ email, salt, id });

    return response.send({ user: email, accessToken, refreshToken: salt });
}