import { FastifyRequest, FastifyReply } from "fastify";
import { createWallet, depositMoney, transferMoney } from "@service/Wallet";
import { getUserBalance } from "@service/Users";

export async function createWalletController(request: FastifyRequest<{ Body: { balance?: number } }>, response: FastifyReply): Promise<FastifyReply> {
    const decoded_data = await request.jwtVerify<{ id: string }>();
    const wallet = await createWallet(response, decoded_data.id, request.body?.balance ?? 0);
    return response.code(200).send(wallet);
}

export async function depositMoneyController(request: FastifyRequest<{ Body: { amount?: number } }>, response: FastifyReply): Promise<FastifyReply> {
    const decoded_data = await request.jwtVerify<{ id: string }>();
    const wallet = await getUserBalance(response, decoded_data.id);
    if (!wallet) {
        return response.status(404).send({ error: "Wallet not found" });
    }

    const transaction = await depositMoney(response, decoded_data.id, request.body?.amount ?? 0);

    return response.code(200).send(transaction);
}

export async function transferMoneyController(request: FastifyRequest<{ Body: { amount: number, receiver_id: string } }>, response: FastifyReply): Promise<FastifyReply> {
    const decoded_data = await request.jwtVerify<{ id: string }>();
    const wallet = await getUserBalance(response, decoded_data.id);
    if (!wallet) {
        return response.status(404).send({ error: "Wallet not found" });
    }
    if (request.body.amount <= 0 || request.body.amount > wallet.balance) {
        return response.status(400).send({ error: "Saldo insuficiente" });
    }
    if (request.body.receiver_id === decoded_data.id) {
        return response.status(400).send({ error: "Você não pode transferir dinheiro para você mesmo" });
    }
    
    const transaction = await transferMoney(response, decoded_data.id, request.body.amount, request.body.receiver_id);
    return response.code(200).send(transaction);
}