import { User } from "@prisma/client";
import prisma from "@utils/dbConnection";
import handleError from "@utils/handleError";
import { hashPassword } from "@utils/hash";
import { FastifyReply } from "fastify";

interface CreateUserResult {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture: string | null;
    created_at: Date | null;
}

export async function createUser(response: FastifyReply, user: User): Promise<CreateUserResult | void> {
    const { hash, salt } = hashPassword(user.password);
    const userData = { ...user, password: hash, salt };

    try {
        const result = await prisma.user.create({
            data: userData,
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                profile_picture: true,
                created_at: true
            }
        });
        return result as CreateUserResult;
    } catch (err: any) {
        handleError(err, response);
    }
}

export async function getUser(response: FastifyReply, email: string): Promise<CreateUserResult | void> {
    try {
        const result = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                profile_picture: true,
                created_at: true,
                salt: true,
                password: true  
            }
        });
        return result as User;
    } catch (err: any) {
        handleError(err, response);
    }
}

export async function updateUser(response: FastifyReply, email: string, user: Partial<User>): Promise<CreateUserResult | void> {
    try {
        const result = await prisma.user.update({
            where: { email },
            data: user,
            select: {
                first_name: true,
                last_name: true,
                email: true,
                profile_picture: true,
                created_at: true
            }
        });
        return result as CreateUserResult;
    } catch (err: any) {
        handleError(err, response);
    }
}

export async function deleteUser(response: FastifyReply, email: string): Promise<void> {
    try {
        await prisma.user.delete({ where: { email } });
    } catch (err: any) {
        handleError(err, response);
        throw new Error("Erro ao deletar usuário");
    }
}