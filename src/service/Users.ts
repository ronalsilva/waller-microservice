import { wallet_ilia } from "@prisma/client";
import prisma from "@utils/dbConnection";
import handleError from "@utils/handleError";
import { FastifyReply } from "fastify";

export async function getUserBalance(response: FastifyReply, id: string): Promise<wallet_ilia | void> {
    try {
        const result = await prisma.wallet_ilia.findUnique({
            where: { user_id: id },
            select: {
                balance: true,
                created_at: true,
                updated_at: true
            }
        });
        return result as wallet_ilia;
    } catch (err: any) {
        handleError(err, response);
    }
}