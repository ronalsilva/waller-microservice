import { FastifyReply } from "fastify";
import { wallet_ilia, wallet_ilia_transaction } from "@prisma/client";
import prisma from "@utils/dbConnection";
import handleError from "@utils/handleError";

export async function calculateBalanceFromTransactions(wallet_id: string, txClient?: any): Promise<number> {
    const client = txClient || prisma;
    
    const transactions = await client.wallet_ilia_transaction.findMany({
        where: { wallet_ilia_id: wallet_id }
    });

    let balance = 0;
    for (const transaction of transactions) {
        switch (transaction.type) {
            case "deposit":
            case "credit":
                balance += transaction.amount;
                break;
            case "withdrawal":
            case "debit":
                balance -= transaction.amount;
                break;
            case "transfer":
                if (transaction.sender_wallet_id === wallet_id) {
                    balance -= transaction.amount;
                } else if (transaction.receiver_wallet_id === wallet_id) {
                    balance += transaction.amount;
                }
                break;
        }
    }
    return balance;
}

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
        const wallet = await prisma.wallet_ilia.findUnique({
            where: { user_id }
        });

        if (!wallet) {
            return handleError({ code: "404", message: "Wallet not found" }, response);
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.wallet_ilia_transaction.create({
                data: {
                    wallet_ilia_id: wallet.id,
                    amount,
                    type: "deposit",
                    description: "Money deposit",
                    created_by: user_id
                }
            });

            const newBalance = await calculateBalanceFromTransactions(wallet.id, tx);

            const updatedWallet = await tx.wallet_ilia.update({
                where: { id: wallet.id },
                data: { balance: newBalance },
                select: {
                    id: true,
                    balance: true,
                    created_at: true,
                    updated_at: true
                }
            });

            return updatedWallet;
        });

        return result as wallet_ilia;
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
            return handleError({ code: "404", message: "Sender wallet not found" }, response);
        }

        if (!receiverWallet) {
            return handleError({ code: "404", message: "Receiver wallet not found" }, response);
        }

        const senderBalance = await calculateBalanceFromTransactions(senderWallet.id);
        if (senderBalance < amount) {
            return handleError({ code: "400", message: "Insufficient balance for transfer" }, response);
        }

        const result = await prisma.$transaction(async (tx) => {
            const senderTransaction = await tx.wallet_ilia_transaction.create({
                data: {
                    wallet_ilia_id: senderWallet.id,
                    amount,
                    type: "transfer",
                    description: `Transfer sent to ${receiver_id}`,
                    created_by: sender_id,
                    receiver_wallet_id: receiverWallet.id,
                    sender_wallet_id: senderWallet.id
                }
            });

            await tx.wallet_ilia_transaction.create({
                data: {
                    wallet_ilia_id: receiverWallet.id,
                    amount,
                    type: "transfer",
                    description: `Transfer received from ${sender_id}`,
                    created_by: sender_id,
                    receiver_wallet_id: receiverWallet.id,
                    sender_wallet_id: senderWallet.id
                }
            });

            const newSenderBalance = await calculateBalanceFromTransactions(senderWallet.id, tx);
            const newReceiverBalance = await calculateBalanceFromTransactions(receiverWallet.id, tx);

            await tx.wallet_ilia.update({
                where: { id: senderWallet.id },
                data: { balance: newSenderBalance }
            });

            await tx.wallet_ilia.update({
                where: { id: receiverWallet.id },
                data: { balance: newReceiverBalance }
            });

            return senderTransaction;
        });

        return result as wallet_ilia_transaction;
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