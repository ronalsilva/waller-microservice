import { FastifyReply } from "fastify";
import {
    createWallet,
    getWallet,
    depositMoney,
    transferMoney,
    calculateBalanceFromTransactions,
    getMoneyTransactions,
} from "@service/Wallet";
import prisma from "@utils/dbConnection";
import handleError from "@utils/handleError";

jest.mock("@utils/dbConnection", () => ({
    __esModule: true,
    default: {
        wallet_ilia: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        wallet_ilia_transaction: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}));

jest.mock("@utils/handleError");

const mockedPrisma = prisma as any;
const mockedHandleError = handleError as jest.MockedFunction<typeof handleError>;

describe("Wallet Service", () => {
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
        mockReply = {
            code: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
        mockedPrisma.wallet_ilia.create.mockReset();
        mockedPrisma.wallet_ilia.findUnique.mockReset();
        mockedPrisma.wallet_ilia.update.mockReset();
        mockedPrisma.wallet_ilia_transaction.create.mockReset();
        mockedPrisma.wallet_ilia_transaction.findMany.mockReset();
        mockedPrisma.$transaction.mockReset();
        mockedPrisma.$transaction.mockImplementation(async (callback: any) => {
            return await callback({});
        });
        mockedHandleError.mockImplementation(() => {});
    });

    describe("createWallet", () => {
        it("deve criar uma carteira com sucesso", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 0,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.create.mockResolvedValue(mockWallet);

            const result = await createWallet(
                mockReply as FastifyReply,
                "user-123",
                0
            );

            expect(mockedPrisma.wallet_ilia.create).toHaveBeenCalledWith({
                data: { user_id: "user-123", balance: 0 },
            });
            expect(result).toEqual(mockWallet);
            expect(mockedHandleError).not.toHaveBeenCalled();
        });

        it("deve criar uma carteira com balance inicial", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 500,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.create.mockResolvedValue(mockWallet);

            const result = await createWallet(
                mockReply as FastifyReply,
                "user-123",
                500
            );

            expect(mockedPrisma.wallet_ilia.create).toHaveBeenCalledWith({
                data: { user_id: "user-123", balance: 500 },
            });
            expect(result).toEqual(mockWallet);
        });

        it("deve chamar handleError em caso de erro", async () => {
            const mockError = { code: "P2002", message: "Unique constraint failed" };

            mockedPrisma.wallet_ilia.create.mockRejectedValue(mockError);

            await createWallet(mockReply as FastifyReply, "user-123", 0);

            expect(mockedHandleError).toHaveBeenCalledWith(mockError, mockReply);
        });
    });

    describe("getWallet", () => {
        it("deve buscar uma carteira com sucesso", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 1000,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(mockWallet);

            const result = await getWallet(mockReply as FastifyReply, "user-123");

            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledWith({
                where: { user_id: "user-123" },
            });
            expect(result).toEqual(mockWallet);
            expect(mockedHandleError).not.toHaveBeenCalled();
        });

        it("deve retornar null quando carteira não encontrada", async () => {
            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(null);

            const result = await getWallet(mockReply as FastifyReply, "user-123");

            expect(result).toBeNull();
        });

        it("deve chamar handleError em caso de erro", async () => {
            const mockError = { code: "P1001", message: "Connection error" };

            mockedPrisma.wallet_ilia.findUnique.mockRejectedValue(mockError);

            await getWallet(mockReply as FastifyReply, "user-123");

            expect(mockedHandleError).toHaveBeenCalledWith(mockError, mockReply);
        });
    });

    describe("depositMoney", () => {
        it("deve depositar dinheiro com sucesso", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 100,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const mockUpdatedWallet = {
                id: "wallet-123",
                balance: 200,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const mockTransactionClient = {
                wallet_ilia_transaction: {
                    create: jest.fn().mockResolvedValue({
                        id: "transaction-123",
                        wallet_ilia_id: "wallet-123",
                        amount: 100,
                        type: "deposit",
                        description: "Money deposit",
                        created_by: "user-123",
                    }),
                    findMany: jest.fn().mockResolvedValue([
                        {
                            id: "transaction-123",
                            wallet_ilia_id: "wallet-123",
                            amount: 100,
                            type: "deposit",
                        }
                    ]),
                },
                wallet_ilia: {
                    update: jest.fn().mockResolvedValue(mockUpdatedWallet),
                },
            };

            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(mockWallet);
            mockedPrisma.$transaction.mockImplementation(async (callback: any) => {
                return await callback(mockTransactionClient);
            });

            const result = await depositMoney(
                mockReply as FastifyReply,
                "user-123",
                100
            );

            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledWith({
                where: { user_id: "user-123" },
            });
            expect(mockTransactionClient.wallet_ilia_transaction.create).toHaveBeenCalledWith({
                data: {
                    wallet_ilia_id: "wallet-123",
                    amount: 100,
                    type: "deposit",
                    description: "Money deposit",
                    created_by: "user-123",
                },
            });
            expect(result).toEqual(mockUpdatedWallet);
        });

        it("deve chamar handleError quando carteira não encontrada", async () => {
            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(null);

            await depositMoney(mockReply as FastifyReply, "user-123", 100);

            expect(mockedHandleError).toHaveBeenCalledWith(
                { code: "404", message: "Wallet not found" },
                mockReply
            );
        });

        it("deve chamar handleError quando transação falha", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 100,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const mockError = { code: "P2003", message: "Foreign key constraint failed" };

            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(mockWallet);
            mockedPrisma.$transaction.mockRejectedValue(mockError);

            await depositMoney(mockReply as FastifyReply, "user-123", 100);

            expect(mockedHandleError).toHaveBeenCalledWith(mockError, mockReply);
        });
    });

    describe("transferMoney", () => {
        it("deve transferir dinheiro com sucesso", async () => {
            const mockSenderWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 500,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const mockReceiverWallet = {
                id: "wallet-456",
                user_id: "user-456",
                balance: 200,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const mockSenderTransaction = {
                id: "transaction-123",
                wallet_ilia_id: "wallet-123",
                amount: 100,
                type: "transfer",
                description: "Transfer sent to user-456",
                created_by: "user-123",
                receiver_wallet_id: "wallet-456",
                sender_wallet_id: "wallet-123",
                created_at: new Date(),
            };

            const mockReceiverTransaction = {
                id: "transaction-456",
                wallet_ilia_id: "wallet-456",
                amount: 100,
                type: "transfer",
                description: "Transfer received from user-123",
                created_by: "user-123",
                receiver_wallet_id: "wallet-456",
                sender_wallet_id: "wallet-123",
            };

            const mockTransactionClient = {
                wallet_ilia_transaction: {
                    create: jest.fn()
                        .mockResolvedValueOnce(mockSenderTransaction)
                        .mockResolvedValueOnce(mockReceiverTransaction),
                    findMany: jest.fn()
                        .mockResolvedValueOnce([
                            { id: "tx-deposit", wallet_ilia_id: "wallet-123", amount: 500, type: "deposit" },
                            { id: "transaction-123", wallet_ilia_id: "wallet-123", amount: 100, type: "transfer", sender_wallet_id: "wallet-123", receiver_wallet_id: "wallet-456" }
                        ])
                        .mockResolvedValueOnce([
                            { id: "transaction-456", wallet_ilia_id: "wallet-456", amount: 100, type: "transfer", sender_wallet_id: "wallet-123", receiver_wallet_id: "wallet-456" }
                        ]),
                },
                wallet_ilia: {
                    update: jest.fn().mockResolvedValue({}),
                },
            };

            mockedPrisma.wallet_ilia.findUnique
                .mockResolvedValueOnce(mockSenderWallet)
                .mockResolvedValueOnce(mockReceiverWallet);
            mockedPrisma.wallet_ilia_transaction.findMany
                .mockResolvedValueOnce([
                    { id: "tx-deposit", wallet_ilia_id: "wallet-123", amount: 500, type: "deposit" }
                ]);
            
            mockedPrisma.$transaction.mockReset();
            mockedPrisma.$transaction.mockImplementation(async (callback: any) => {
                try {
                    const result = await callback(mockTransactionClient);
                    return result;
                } catch (error) {
                    throw error;
                }
            });

            const result = await transferMoney(
                mockReply as FastifyReply,
                "user-123",
                100,
                "user-456"
            );

            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledTimes(2);
            expect(mockedPrisma.wallet_ilia_transaction.findMany).toHaveBeenCalledTimes(1);
            expect(mockedPrisma.$transaction).toHaveBeenCalled();
            expect(result).toEqual(mockSenderTransaction);
        });

        it("deve chamar handleError quando carteira do remetente não encontrada", async () => {
            mockedPrisma.wallet_ilia.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            await transferMoney(
                mockReply as FastifyReply,
                "user-123",
                100,
                "user-456"
            );

            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledTimes(2);
            expect(mockedHandleError).toHaveBeenCalledWith(
                { code: "404", message: "Sender wallet not found" },
                mockReply
            );
        });

        it("deve chamar handleError quando carteira do destinatário não encontrada", async () => {
            const mockSenderWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 500,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.findUnique
                .mockResolvedValueOnce(mockSenderWallet)
                .mockResolvedValueOnce(null);
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValueOnce([]);

            await transferMoney(
                mockReply as FastifyReply,
                "user-123",
                100,
                "user-456"
            );

            expect(mockedHandleError).toHaveBeenCalledWith(
                { code: "404", message: "Receiver wallet not found" },
                mockReply
            );
        });

        it("deve chamar handleError quando saldo insuficiente", async () => {
            const mockSenderWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 50,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const mockReceiverWallet = {
                id: "wallet-456",
                user_id: "user-456",
                balance: 200,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.findUnique
                .mockResolvedValueOnce(mockSenderWallet)
                .mockResolvedValueOnce(mockReceiverWallet);
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValueOnce([]);

            await transferMoney(
                mockReply as FastifyReply,
                "user-123",
                100,
                "user-456"
            );

            expect(mockedHandleError).toHaveBeenCalledWith(
                { code: "400", message: "Insufficient balance for transfer" },
                mockReply
            );
        });

        it("deve chamar handleError em caso de erro na transferência", async () => {
            const mockError = { code: "P1001", message: "Connection error" };

            mockedPrisma.wallet_ilia.findUnique.mockRejectedValue(mockError);

            await transferMoney(
                mockReply as FastifyReply,
                "user-123",
                100,
                "user-456"
            );

            expect(mockedHandleError).toHaveBeenCalledWith(mockError, mockReply);
        });
    });

    describe("calculateBalanceFromTransactions", () => {
        it("deve calcular saldo com transações de deposit", async () => {
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValue([
                { id: "tx1", amount: 100, type: "deposit" },
                { id: "tx2", amount: 50, type: "deposit" },
            ]);

            const result = await calculateBalanceFromTransactions("wallet-123");

            expect(result).toBe(150);
            expect(mockedPrisma.wallet_ilia_transaction.findMany).toHaveBeenCalledWith({
                where: { wallet_ilia_id: "wallet-123" },
            });
        });

        it("deve calcular saldo com transações de credit", async () => {
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValue([
                { id: "tx1", amount: 200, type: "credit" },
                { id: "tx2", amount: 100, type: "credit" },
            ]);

            const result = await calculateBalanceFromTransactions("wallet-123");

            expect(result).toBe(300);
        });

        it("deve calcular saldo com transações de withdrawal", async () => {
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValue([
                { id: "tx1", amount: 100, type: "deposit" },
                { id: "tx2", amount: 30, type: "withdrawal" },
            ]);

            const result = await calculateBalanceFromTransactions("wallet-123");

            expect(result).toBe(70);
        });

        it("deve calcular saldo com transações de debit", async () => {
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValue([
                { id: "tx1", amount: 200, type: "deposit" },
                { id: "tx2", amount: 50, type: "debit" },
            ]);

            const result = await calculateBalanceFromTransactions("wallet-123");

            expect(result).toBe(150);
        });

        it("deve calcular saldo com transações de transfer como sender", async () => {
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValue([
                { id: "tx1", amount: 100, type: "deposit" },
                { id: "tx2", amount: 40, type: "transfer", sender_wallet_id: "wallet-123", receiver_wallet_id: "wallet-456" },
            ]);

            const result = await calculateBalanceFromTransactions("wallet-123");

            expect(result).toBe(60);
        });

        it("deve calcular saldo com transações de transfer como receiver", async () => {
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValue([
                { id: "tx1", amount: 100, type: "deposit" },
                { id: "tx2", amount: 40, type: "transfer", sender_wallet_id: "wallet-456", receiver_wallet_id: "wallet-123" },
            ]);

            const result = await calculateBalanceFromTransactions("wallet-123");

            expect(result).toBe(140);
        });

        it("deve calcular saldo com múltiplos tipos de transação", async () => {
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValue([
                { id: "tx1", amount: 500, type: "deposit" },
                { id: "tx2", amount: 200, type: "credit" },
                { id: "tx3", amount: 100, type: "withdrawal" },
                { id: "tx4", amount: 50, type: "debit" },
                { id: "tx5", amount: 75, type: "transfer", sender_wallet_id: "wallet-123", receiver_wallet_id: "wallet-456" },
                { id: "tx6", amount: 25, type: "transfer", sender_wallet_id: "wallet-789", receiver_wallet_id: "wallet-123" },
            ]);

            const result = await calculateBalanceFromTransactions("wallet-123");

            expect(result).toBe(500 + 200 - 100 - 50 - 75 + 25); // 500
        });

        it("deve usar txClient quando fornecido", async () => {
            const mockTxClient = {
                wallet_ilia_transaction: {
                    findMany: jest.fn().mockResolvedValue([
                        { id: "tx1", amount: 100, type: "deposit" },
                    ]),
                },
            };

            const result = await calculateBalanceFromTransactions("wallet-123", mockTxClient);

            expect(result).toBe(100);
            expect(mockTxClient.wallet_ilia_transaction.findMany).toHaveBeenCalledWith({
                where: { wallet_ilia_id: "wallet-123" },
            });
            expect(mockedPrisma.wallet_ilia_transaction.findMany).not.toHaveBeenCalled();
        });
    });

    describe("getMoneyTransactions", () => {
        it("deve retornar transações com sucesso", async () => {
            const mockTransactions = [
                {
                    id: "tx-1",
                    amount: 100,
                    type: "deposit",
                    description: "Deposit",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: "tx-2",
                    amount: 50,
                    type: "withdrawal",
                    description: "Withdrawal",
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValue(mockTransactions);

            const result = await getMoneyTransactions(mockReply as FastifyReply, "wallet-123");

            expect(mockedPrisma.wallet_ilia_transaction.findMany).toHaveBeenCalledWith({
                where: { wallet_ilia_id: "wallet-123" },
                select: {
                    id: true,
                    amount: true,
                    type: true,
                    description: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            expect(result).toEqual(mockTransactions);
        });

        it("deve retornar array vazio quando não há transações", async () => {
            mockedPrisma.wallet_ilia_transaction.findMany.mockResolvedValue([]);

            const result = await getMoneyTransactions(mockReply as FastifyReply, "wallet-123");

            expect(result).toEqual([]);
        });

        it("deve chamar handleError e retornar array vazio em caso de erro", async () => {
            const mockError = { code: "P1001", message: "Connection error" };

            mockedPrisma.wallet_ilia_transaction.findMany.mockRejectedValue(mockError);

            const result = await getMoneyTransactions(mockReply as FastifyReply, "wallet-123");

            expect(mockedHandleError).toHaveBeenCalledWith(mockError, mockReply);
            expect(result).toEqual([]);
        });
    });
});
