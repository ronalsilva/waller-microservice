import { FastifyRequest, FastifyReply } from "fastify";
import { getUserBalanceController } from "@controllers/Users";
import * as UsersService from "@service/Users";

// Mock do serviço
jest.mock("@service/Users");

describe("Users Controller", () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;
    let mockJwtVerify: jest.Mock;

    beforeEach(() => {
        // Mock do request
        mockJwtVerify = jest.fn();
        mockRequest = {
            jwtVerify: mockJwtVerify,
        };

        // Mock do reply
        mockReply = {
            code: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        // Limpar mocks
        jest.clearAllMocks();
    });

    describe("getUserBalanceController", () => {
        it("deve retornar o saldo do usuário com sucesso", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 1000,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);

            await getUserBalanceController(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            expect(mockJwtVerify).toHaveBeenCalled();
            expect(UsersService.getUserBalance).toHaveBeenCalledWith(
                mockReply,
                "user-123"
            );
            expect(mockReply.code).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockWallet);
        });

        it("deve chamar o serviço com o id correto do JWT", async () => {
            const mockWallet = {
                id: "wallet-456",
                user_id: "user-456",
                balance: 500,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockJwtVerify.mockResolvedValue({ id: "user-456" });
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);

            await getUserBalanceController(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

            expect(UsersService.getUserBalance).toHaveBeenCalledWith(
                mockReply,
                "user-456"
            );
        });
    });
});

