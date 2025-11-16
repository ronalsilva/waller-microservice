import { FastifyRequest, FastifyReply } from "fastify";
import { createWallet, depositMoney, transferMoney, getMoneyTransactions } from "@service/Wallet";
import { getUserBalance } from "@service/Users";
import { getUserByIdFromClientService } from "@middleware/kafka/userService";

export async function createWalletController(request: FastifyRequest<{ Body: { balance?: number } }>, response: FastifyReply): Promise<FastifyReply> {
    if (!request.clientUser) {
        return response.status(401).send({ error: "Unauthorized", message: "Token de autenticação inválido ou expirado" });
    }

    const userId = request.clientUser.id;
    const userFromClient = await getUserByIdFromClientService(userId);

    if (!userFromClient) {
        return response.status(404).send({ error: "Usuário não encontrado", message: "Usuário não encontrado no client-microservice" });
    }

    const wallet = await createWallet(response, userId, request.body?.balance ?? 0);
    return response.code(200).send(wallet);
}

export async function depositMoneyController(request: FastifyRequest<{ Body: { amount?: number } }>, response: FastifyReply): Promise<FastifyReply> {
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
        return response.status(404).send({ error: "Wallet not found", message: "Carteira não encontrada" });
    }

    const transaction = await depositMoney(response, userId, request.body?.amount ?? 0);

    return response.code(200).send(transaction);
}

export async function transferMoneyController(request: FastifyRequest<{ Body: { amount: number, receiver_id: string } }>, response: FastifyReply): Promise<FastifyReply> {
    if (!request.clientUser) {
        return response.status(401).send({ error: "Unauthorized", message: "Token de autenticação inválido ou expirado" });
    }

    const userId = request.clientUser.id;
    const senderUser = await getUserByIdFromClientService(userId);

    if (!senderUser) {
        return response.status(404).send({ error: "Usuário remetente não encontrado", message: "Usuário remetente não encontrado no client-microservice" });
    }

    const receiverUser = await getUserByIdFromClientService(request.body.receiver_id);
    if (!receiverUser) {
        return response.status(404).send({ error: "Usuário destinatário não encontrado", message: "Usuário destinatário não encontrado no client-microservice" });
    }

    const wallet = await getUserBalance(response, userId);
    if (!wallet) {
        return response.status(404).send({ error: "Wallet not found", message: "Carteira não encontrada" });
    }
    if (request.body.amount <= 0 || request.body.amount > wallet.balance) {
        return response.status(400).send({ error: "Saldo insuficiente", message: "Saldo insuficiente para transferência" });
    }
    if (request.body.receiver_id === userId) {
        return response.status(400).send({ error: "Você não pode transferir dinheiro para você mesmo", message: "Você não pode transferir dinheiro para você mesmo" });
    }
    
    const transaction = await transferMoney(response, userId, request.body.amount, request.body.receiver_id);
    return response.code(200).send(transaction);
}

export async function getMoneyTransactionsController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    if (!request.clientUser) {
        return response.status(401).send({ error: "Unauthorized", message: "Token de autenticação inválido ou expirado" });
    }

    const userId = request.clientUser.id;
    const wallet = await getUserBalance(response, userId);
    if (!wallet) {
        return response.status(404).send({ error: "Wallet not found", message: "Carteira não encontrada" });
    }

    const transactions = await getMoneyTransactions(response, wallet.id);
    if (!transactions) {
        return response.status(404).send({ error: "Transactions not found", message: "Transações não encontradas" });
    }
    return response.code(200).send(transactions);
}