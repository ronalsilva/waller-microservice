import { FastifyRequest, FastifyReply } from "fastify";
import {
    createWalletController,
    depositMoneyController,
    transferMoneyController,
} from "@controllers/Wallet";
import * as WalletService from "@service/Wallet";
import * as UsersService from "@service/Users";

// Mock dos serviços
jest.mock("@service/Wallet");
jest.mock("@service/Users");

describe("Wallet Controller", () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;
    let mockJwtVerify: jest.Mock;

    beforeEach(() => {
        // Mock do request
        mockJwtVerify = jest.fn();
        mockRequest = {
            jwtVerify: mockJwtVerify,
            body: {},
        };

        // Mock do reply
        mockReply = {
            code: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        // Limpar mocks
        jest.clearAllMocks();
    });

    describe("createWalletController", () => {
        it("deve criar uma carteira com sucesso", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 100,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            (WalletService.createWallet as jest.Mock).mockResolvedValue(mockWallet);

            await createWalletController(
                mockRequest as FastifyRequest<{ Body: { balance?: number } }>,
                mockReply as FastifyReply
            );

            expect(mockJwtVerify).toHaveBeenCalled();
            expect(WalletService.createWallet).toHaveBeenCalledWith(
                mockReply,
                "user-123",
                0
            );
            expect(mockReply.code).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockWallet);
        });

        it("deve criar uma carteira com balance inicial", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 500,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            mockRequest.body = { balance: 500 };
            (WalletService.createWallet as jest.Mock).mockResolvedValue(mockWallet);

            await createWalletController(
                mockRequest as FastifyRequest<{ Body: { balance?: number } }>,
                mockReply as FastifyReply
            );

            expect(WalletService.createWallet).toHaveBeenCalledWith(
                mockReply,
                "user-123",
                500
            );
        });
    });

    describe("depositMoneyController", () => {
        it("deve depositar dinheiro com sucesso", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 100,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const mockTransaction = {
                id: "wallet-123",
                balance: 200,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            mockRequest.body = { amount: 100 };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);
            (WalletService.depositMoney as jest.Mock).mockResolvedValue(mockTransaction);

            await depositMoneyController(
                mockRequest as FastifyRequest<{ Body: { amount?: number } }>,
                mockReply as FastifyReply
            );

            expect(mockJwtVerify).toHaveBeenCalled();
            expect(UsersService.getUserBalance).toHaveBeenCalledWith(
                mockReply,
                "user-123"
            );
            expect(WalletService.depositMoney).toHaveBeenCalledWith(
                mockReply,
                "user-123",
                100
            );
            expect(mockReply.code).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockTransaction);
        });

        it("deve retornar 404 quando carteira não encontrada", async () => {
            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            mockRequest.body = { amount: 100 };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(null);

            await depositMoneyController(
                mockRequest as FastifyRequest<{ Body: { amount?: number } }>,
                mockReply as FastifyReply
            );

            expect(UsersService.getUserBalance).toHaveBeenCalled();
            expect(WalletService.depositMoney).not.toHaveBeenCalled();
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: "Wallet not found" });
        });

        it("deve usar amount 0 quando não fornecido", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 100,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            mockRequest.body = {};
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);
            (WalletService.depositMoney as jest.Mock).mockResolvedValue(mockWallet);

            await depositMoneyController(
                mockRequest as FastifyRequest<{ Body: { amount?: number } }>,
                mockReply as FastifyReply
            );

            expect(WalletService.depositMoney).toHaveBeenCalledWith(
                mockReply,
                "user-123",
                0
            );
        });
    });

    describe("transferMoneyController", () => {
        it("deve transferir dinheiro com sucesso", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 500,
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

            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            mockRequest.body = { amount: 100, receiver_id: "user-456" };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);
            (WalletService.transferMoney as jest.Mock).mockResolvedValue(mockTransaction);

            await transferMoneyController(
                mockRequest as FastifyRequest<{
                    Body: { amount: number; receiver_id: string };
                }>,
                mockReply as FastifyReply
            );

            expect(mockJwtVerify).toHaveBeenCalled();
            expect(UsersService.getUserBalance).toHaveBeenCalledWith(
                mockReply,
                "user-123"
            );
            expect(WalletService.transferMoney).toHaveBeenCalledWith(
                mockReply,
                "user-123",
                100,
                "user-456"
            );
            expect(mockReply.code).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith(mockTransaction);
        });

        it("deve retornar 404 quando carteira não encontrada", async () => {
            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            mockRequest.body = { amount: 100, receiver_id: "user-456" };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(null);

            await transferMoneyController(
                mockRequest as FastifyRequest<{
                    Body: { amount: number; receiver_id: string };
                }>,
                mockReply as FastifyReply
            );

            expect(UsersService.getUserBalance).toHaveBeenCalled();
            expect(WalletService.transferMoney).not.toHaveBeenCalled();
            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: "Wallet not found" });
        });

        it("deve retornar 400 quando amount é menor ou igual a 0", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 500,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            mockRequest.body = { amount: 0, receiver_id: "user-456" };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);

            await transferMoneyController(
                mockRequest as FastifyRequest<{
                    Body: { amount: number; receiver_id: string };
                }>,
                mockReply as FastifyReply
            );

            expect(WalletService.transferMoney).not.toHaveBeenCalled();
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: "Saldo insuficiente",
            });
        });

        it("deve retornar 400 quando amount é maior que o saldo", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 50,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            mockRequest.body = { amount: 100, receiver_id: "user-456" };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);

            await transferMoneyController(
                mockRequest as FastifyRequest<{
                    Body: { amount: number; receiver_id: string };
                }>,
                mockReply as FastifyReply
            );

            expect(WalletService.transferMoney).not.toHaveBeenCalled();
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: "Saldo insuficiente",
            });
        });

        it("deve retornar 400 quando tenta transferir para si mesmo", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 500,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockJwtVerify.mockResolvedValue({ id: "user-123" });
            mockRequest.body = { amount: 100, receiver_id: "user-123" };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);

            await transferMoneyController(
                mockRequest as FastifyRequest<{
                    Body: { amount: number; receiver_id: string };
                }>,
                mockReply as FastifyReply
            );

            expect(WalletService.transferMoney).not.toHaveBeenCalled();
            expect(mockReply.status).toHaveBeenCalledWith(400);
            expect(mockReply.send).toHaveBeenCalledWith({
                error: "Você não pode transferir dinheiro para você mesmo",
            });
        });
    });
});

