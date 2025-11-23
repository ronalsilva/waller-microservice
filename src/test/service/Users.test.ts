import { FastifyReply } from "fastify";
import { getUserBalance } from "@service/Users";
import prisma from "@utils/dbConnection";
import handleError from "@utils/handleError";
import * as WalletService from "@service/Wallet";

jest.mock("@utils/dbConnection", () => ({
    __esModule: true,
    default: {
        wallet_ilia: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock("@utils/handleError");
jest.mock("@service/Wallet");

const mockedPrisma = prisma as any;
const mockedHandleError = handleError as jest.MockedFunction<typeof handleError>;
const mockedWalletService = WalletService as jest.Mocked<typeof WalletService>;

describe("Users Service", () => {
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
        mockReply = {
            code: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
        mockedHandleError.mockImplementation(() => {});
    });

    describe("getUserBalance", () => {
        it("deve retornar o saldo do usuário com sucesso", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 1000,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(mockWallet);
            mockedWalletService.calculateBalanceFromTransactions.mockResolvedValue(1000);

            const result = await getUserBalance(mockReply as FastifyReply, "user-123");

            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledWith({
                where: { user_id: "user-123" },
            });
            expect(mockedWalletService.calculateBalanceFromTransactions).toHaveBeenCalledWith("wallet-123");
            expect(result).toEqual({
                ...mockWallet,
                balance: 1000
            });
            expect(mockedHandleError).not.toHaveBeenCalled();
        });

        it("deve atualizar o saldo quando diferente do calculado", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 1000,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(mockWallet);
            mockedWalletService.calculateBalanceFromTransactions.mockResolvedValue(1500);
            mockedPrisma.wallet_ilia.update.mockResolvedValue({ ...mockWallet, balance: 1500 });

            const result = await getUserBalance(mockReply as FastifyReply, "user-123");

            expect(mockedPrisma.wallet_ilia.update).toHaveBeenCalledWith({
                where: { id: "wallet-123" },
                data: { balance: 1500 }
            });
            expect(result).toEqual({
                ...mockWallet,
                balance: 1500
            });
        });

        it("deve chamar handleError quando carteira não encontrada", async () => {
            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(null);

            await getUserBalance(mockReply as FastifyReply, "user-123");

            expect(mockedHandleError).toHaveBeenCalledWith(
                { code: "404", message: "Wallet not found" },
                mockReply
            );
        });

        it("deve chamar handleError em caso de erro", async () => {
            const mockError = { code: "P1001", message: "Connection error" };

            mockedPrisma.wallet_ilia.findUnique.mockRejectedValue(mockError);

            await getUserBalance(mockReply as FastifyReply, "user-123");

            expect(mockedHandleError).toHaveBeenCalledWith(mockError, mockReply);
        });

        it("deve buscar com o user_id correto", async () => {
            const mockWallet = {
                id: "wallet-456",
                user_id: "user-456",
                balance: 750,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(mockWallet);
            mockedWalletService.calculateBalanceFromTransactions.mockResolvedValue(750);

            await getUserBalance(mockReply as FastifyReply, "user-456");

            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledWith({
                where: { user_id: "user-456" },
            });
        });
    });
});
