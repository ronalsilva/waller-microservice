import { FastifyReply } from "fastify";
import { wallet_ilia, wallet_ilia_transaction } from "@prisma/client";
import prisma from "@utils/dbConnection";
import handleError from "@utils/handleError";

export async function createWallet(response: FastifyReply, user_id: string, balance: number = 0): Promise<wallet_ilia | void> {
    try {
        const wallet = await prisma.wallet_ilia.create({
            data: { user_id, balance }
        });
        return wallet as wallet_ilia;
    } catch (err: any) {
        handleError(err, response);
    }
}

export async function getWallet(response: FastifyReply, user_id: string): Promise<wallet_ilia | void> {
    try {
        const wallet = await prisma.wallet_ilia.findUnique({
            where: { user_id }
        });
        return wallet as wallet_ilia;
    } catch (err: any) {
        handleError(err, response);
    }
}
    
export async function depositMoney(response: FastifyReply, user_id: string, amount: number): Promise<wallet_ilia | void> {
    try {       
        const transaction = await prisma.wallet_ilia.update({
            where: { user_id },
            data: { balance: { increment: amount } },
            select: {
                id: true,
                balance: true,
                created_at: true,
                updated_at: true
            }
        });

        try {
            await prisma.wallet_ilia_transaction.create({
                data: { wallet_ilia_id: transaction.id, amount, type: "deposit", description: "Depósito de dinheiro", created_by: user_id }
            });
        } catch (err: any) {
            handleError(err, response);
        }

        return transaction as wallet_ilia;
    } catch (err: any) {
        handleError(err, response);
    }
}

export async function transferMoney(response: FastifyReply, sender_id: string, amount: number, receiver_id: string): Promise<wallet_ilia_transaction | void> {  
    try {
        const senderWallet = await prisma.wallet_ilia.findUnique({
            where: { user_id: sender_id }
        });

        const receiverWallet = await prisma.wallet_ilia.findUnique({
            where: { user_id: receiver_id }
        });

        if (!senderWallet) {
            return handleError({ code: "404", message: "Carteira do remetente não encontrada" }, response);
        }

        if (!receiverWallet) {
            return handleError({ code: "404", message: "Carteira do destinatário não encontrada" }, response);
        }

        await prisma.wallet_ilia.update({
            where: { id: senderWallet.id },
            data: { balance: { decrement: amount } }
        });

        await prisma.wallet_ilia.update({
            where: { id: receiverWallet.id },
            data: { balance: { increment: amount } }
        });

        const transaction = await prisma.wallet_ilia_transaction.create({
            data: { 
                wallet_ilia_id: senderWallet.id, 
                amount, 
                type: "transfer", 
                description: "Transferência de dinheiro", 
                created_by: sender_id, 
                receiver_wallet_id: receiverWallet.id, 
                sender_wallet_id: senderWallet.id 
            }
        });
        return transaction as wallet_ilia_transaction;
    } catch (err: any) {
        handleError(err, response);
    }
}

export async function getMoneyTransactions(response: FastifyReply, wallet_id: string): Promise<wallet_ilia_transaction[] | void> {
    try {
        const transactions = await prisma.wallet_ilia_transaction.findMany({
            where: { wallet_ilia_id: wallet_id },
            select: {
                id: true,
                amount: true,
                type: true,
                description: true,
                created_at: true,
                updated_at: true
            }
        });
        return transactions as wallet_ilia_transaction[];
    } catch (err: any) {
        handleError(err, response);
        return [];
    }
}