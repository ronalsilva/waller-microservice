import { FastifyReply } from "fastify";
import {
    createWallet,
    getWallet,
    depositMoney,
    transferMoney,
} from "@service/Wallet";
import prisma from "@utils/dbConnection";
import handleError from "@utils/handleError";

// Mock do Prisma e handleError
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
        },
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

        // Reset mocks
        jest.clearAllMocks();
        mockedPrisma.wallet_ilia.create.mockReset();
        mockedPrisma.wallet_ilia.findUnique.mockReset();
        mockedPrisma.wallet_ilia.update.mockReset();
        mockedPrisma.wallet_ilia_transaction.create.mockReset();
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
            const mockUpdatedWallet = {
                id: "wallet-123",
                balance: 200,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.update.mockResolvedValue(mockUpdatedWallet);
            mockedPrisma.wallet_ilia_transaction.create.mockResolvedValue({
                id: "transaction-123",
                wallet_ilia_id: "wallet-123",
                amount: 100,
                type: "deposit",
                description: "Depósito de dinheiro",
                created_by: "user-123",
                created_at: new Date(),
            });

            const result = await depositMoney(
                mockReply as FastifyReply,
                "user-123",
                100
            );

            expect(mockedPrisma.wallet_ilia.update).toHaveBeenCalledWith({
                where: { user_id: "user-123" },
                data: { balance: { increment: 100 } },
                select: {
                    id: true,
                    balance: true,
                    created_at: true,
                    updated_at: true,
                },
            });

            expect(mockedPrisma.wallet_ilia_transaction.create).toHaveBeenCalledWith({
                data: {
                    wallet_ilia_id: "wallet-123",
                    amount: 100,
                    type: "deposit",
                    description: "Depósito de dinheiro",
                    created_by: "user-123",
                },
            });

            expect(result).toEqual(mockUpdatedWallet);
        });

        it("deve chamar handleError quando update falha", async () => {
            const mockError = { code: "P2025", message: "Record not found" };

            mockedPrisma.wallet_ilia.update.mockRejectedValue(mockError);

            await depositMoney(mockReply as FastifyReply, "user-123", 100);

            expect(mockedHandleError).toHaveBeenCalledWith(mockError, mockReply);
        });

        it("deve chamar handleError quando criação de transação falha", async () => {
            const mockUpdatedWallet = {
                id: "wallet-123",
                balance: 200,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const mockError = { code: "P2003", message: "Foreign key constraint failed" };

            mockedPrisma.wallet_ilia.update.mockResolvedValue(mockUpdatedWallet);
            mockedPrisma.wallet_ilia_transaction.create.mockRejectedValue(mockError);

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

            const mockTransaction = {
                id: "transaction-123",
                wallet_ilia_id: "wallet-123",
                amount: 100,
                type: "transfer",
                description: "Transferência de dinheiro",
                created_by: "user-123",
                receiver_wallet_id: "wallet-456",
                sender_wallet_id: "wallet-123",
                created_at: new Date(),
            };

            mockedPrisma.wallet_ilia.findUnique
                .mockResolvedValueOnce(mockSenderWallet)
                .mockResolvedValueOnce(mockReceiverWallet);

            mockedPrisma.wallet_ilia.update.mockResolvedValue({});
            mockedPrisma.wallet_ilia_transaction.create.mockResolvedValue(mockTransaction);

            const result = await transferMoney(
                mockReply as FastifyReply,
                "user-123",
                100,
                "user-456"
            );

            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledTimes(2);
            expect(mockedPrisma.wallet_ilia.update).toHaveBeenCalledTimes(2);
            expect(mockedPrisma.wallet_ilia.update).toHaveBeenNthCalledWith(1, {
                where: { id: "wallet-123" },
                data: { balance: { decrement: 100 } },
            });
            expect(mockedPrisma.wallet_ilia.update).toHaveBeenNthCalledWith(2, {
                where: { id: "wallet-456" },
                data: { balance: { increment: 100 } },
            });

            expect(mockedPrisma.wallet_ilia_transaction.create).toHaveBeenCalledWith({
                data: {
                    wallet_ilia_id: "wallet-123",
                    amount: 100,
                    type: "transfer",
                    description: "Transferência de dinheiro",
                    created_by: "user-123",
                    receiver_wallet_id: "wallet-456",
                    sender_wallet_id: "wallet-123",
                },
            });

            expect(result).toEqual(mockTransaction);
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
                { code: "404", message: "Carteira do remetente não encontrada" },
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

            await transferMoney(
                mockReply as FastifyReply,
                "user-123",
                100,
                "user-456"
            );

            expect(mockedHandleError).toHaveBeenCalledWith(
                { code: "404", message: "Carteira do destinatário não encontrada" },
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
});
