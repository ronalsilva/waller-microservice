import { FastifyReply } from "fastify";
import { getUserBalance } from "@service/Users";
import prisma from "@utils/dbConnection";
import handleError from "@utils/handleError";

// Mock do Prisma e handleError
jest.mock("@utils/dbConnection", () => ({
    __esModule: true,
    default: {
        wallet_ilia: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock("@utils/handleError");

const mockedPrisma = prisma as any;
const mockedHandleError = handleError as jest.MockedFunction<typeof handleError>;

describe("Users Service", () => {
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
        mockReply = {
            code: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        // Reset mocks
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

            const result = await getUserBalance(mockReply as FastifyReply, "user-123");

            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledWith({
                where: { user_id: "user-123" },
                select: {
                    balance: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            expect(result).toEqual(mockWallet);
            expect(mockedHandleError).not.toHaveBeenCalled();
        });

        it("deve retornar null quando carteira não encontrada", async () => {
            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(null);

            const result = await getUserBalance(mockReply as FastifyReply, "user-123");

            expect(result).toBeNull();
            expect(mockedHandleError).not.toHaveBeenCalled();
        });

        it("deve retornar apenas os campos selecionados", async () => {
            const mockWallet = {
                balance: 500,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(mockWallet);

            const result = await getUserBalance(mockReply as FastifyReply, "user-123");

            expect(result).toEqual(mockWallet);
            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledWith({
                where: { user_id: "user-123" },
                select: {
                    balance: true,
                    created_at: true,
                    updated_at: true,
                },
            });
        });

        it("deve chamar handleError em caso de erro", async () => {
            const mockError = { code: "P1001", message: "Connection error" };

            mockedPrisma.wallet_ilia.findUnique.mockRejectedValue(mockError);

            await getUserBalance(mockReply as FastifyReply, "user-123");

            expect(mockedHandleError).toHaveBeenCalledWith(mockError, mockReply);
        });

        it("deve buscar com o user_id correto", async () => {
            const mockWallet = {
                balance: 750,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockedPrisma.wallet_ilia.findUnique.mockResolvedValue(mockWallet);

            await getUserBalance(mockReply as FastifyReply, "user-456");

            expect(mockedPrisma.wallet_ilia.findUnique).toHaveBeenCalledWith({
                where: { user_id: "user-456" },
                select: {
                    balance: true,
                    created_at: true,
                    updated_at: true,
                },
            });
        });
    });
});
