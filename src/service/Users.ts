import { wallet_ilia } from "@prisma/client";
import prisma from "@utils/dbConnection";
import handleError from "@utils/handleError";
import { FastifyReply } from "fastify";
import { calculateBalanceFromTransactions } from "@service/Wallet";

export async function getUserBalance(response: FastifyReply, id: string): Promise<wallet_ilia | void> {
    try {
        const wallet = await prisma.wallet_ilia.findUnique({
            where: { user_id: id }
        });

        if (!wallet) {
            return handleError({ code: "404", message: "Wallet not found" }, response);
        }

        const calculatedBalance = await calculateBalanceFromTransactions(wallet.id);

        if (wallet.balance !== calculatedBalance) {
            await prisma.wallet_ilia.update({
                where: { id: wallet.id },
                data: { balance: calculatedBalance }
            });
        }

        return {
            ...wallet,
            balance: calculatedBalance
        } as wallet_ilia;
    } catch (err: any) {
        handleError(err, response);
    }
}