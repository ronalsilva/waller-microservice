import { FastifyRequest, FastifyReply } from "fastify";
import {
    createWalletController,
    depositMoneyController,
    transferMoneyController,
	getMoneyTransactionsController,
} from "@controllers/Wallet";
import * as WalletService from "@service/Wallet";
import * as UsersService from "@service/Users";
import { getUserByIdFromClientService } from "@middleware/kafka/userService";

// Mock dos serviços
jest.mock("@service/Wallet");
jest.mock("@service/Users");
jest.mock("@middleware/kafka/userService", () => ({
	getUserByIdFromClientService: jest.fn().mockResolvedValue({ id: "any-user" }),
}));

describe("Wallet Controller", () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
        // Mock do request
        mockRequest = {
			clientUser: { id: "user-123" } as any,
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
		it("deve retornar 401 quando não autenticado", async () => {
			delete (mockRequest as any).clientUser;

			await createWalletController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(401);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Unauthorized",
				message: "Token de autenticação inválido ou expirado",
			});
		});

		it("deve retornar 404 quando usuário não encontrado no client-microservice", async () => {
			(getUserByIdFromClientService as jest.Mock).mockResolvedValueOnce(null);

			await createWalletController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Usuário não encontrado",
				message: "Usuário não encontrado no client-microservice",
			});
		});
        it("deve criar uma carteira com sucesso", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 100,
                created_at: new Date(),
                updated_at: new Date(),
            };

            (WalletService.createWallet as jest.Mock).mockResolvedValue(mockWallet);

            await createWalletController(
                mockRequest as FastifyRequest<{ Body: { balance?: number } }>,
                mockReply as FastifyReply
            );

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
		it("deve retornar 401 quando não autenticado", async () => {
			delete (mockRequest as any).clientUser;

			await depositMoneyController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(401);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Unauthorized",
				message: "Token de autenticação inválido ou expirado",
			});
		});
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

            mockRequest.body = { amount: 100 };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);
            (WalletService.depositMoney as jest.Mock).mockResolvedValue(mockTransaction);

            await depositMoneyController(
                mockRequest as FastifyRequest<{ Body: { amount?: number } }>,
                mockReply as FastifyReply
            );

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
            mockRequest.body = { amount: 100 };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(null);

            await depositMoneyController(
                mockRequest as FastifyRequest<{ Body: { amount?: number } }>,
                mockReply as FastifyReply
            );

            expect(UsersService.getUserBalance).toHaveBeenCalled();
            expect(WalletService.depositMoney).not.toHaveBeenCalled();
            expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({ error: "Wallet not found", message: "Carteira não encontrada" });
        });

        it("deve usar amount 0 quando não fornecido", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 100,
                created_at: new Date(),
                updated_at: new Date(),
            };

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
		it("deve retornar 401 quando não autenticado", async () => {
			delete (mockRequest as any).clientUser;

			await transferMoneyController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(401);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Unauthorized",
				message: "Token de autenticação inválido ou expirado",
			});
		});

		it("deve retornar 404 quando usuário remetente não encontrado no client-microservice", async () => {
			(getUserByIdFromClientService as jest.Mock).mockResolvedValueOnce(null);
			mockRequest.body = { amount: 100, receiver_id: "user-456" };

			await transferMoneyController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Usuário remetente não encontrado",
				message: "Usuário remetente não encontrado no client-microservice",
			});
		});

		it("deve retornar 404 quando usuário destinatário não encontrado no client-microservice", async () => {
			(getUserByIdFromClientService as jest.Mock)
				.mockResolvedValueOnce({ id: "user-123" })
				.mockResolvedValueOnce(null);
			mockRequest.body = { amount: 100, receiver_id: "user-456" };

			await transferMoneyController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Usuário destinatário não encontrado",
				message: "Usuário destinatário não encontrado no client-microservice",
			});
		});
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

            mockRequest.body = { amount: 100, receiver_id: "user-456" };
            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);
            (WalletService.transferMoney as jest.Mock).mockResolvedValue(mockTransaction);

            await transferMoneyController(
                mockRequest as FastifyRequest<{
                    Body: { amount: number; receiver_id: string };
                }>,
                mockReply as FastifyReply
            );

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
			expect(mockReply.send).toHaveBeenCalledWith({ error: "Wallet not found", message: "Carteira não encontrada" });
        });

        it("deve retornar 400 quando amount é menor ou igual a 0", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                balance: 500,
                created_at: new Date(),
                updated_at: new Date(),
            };

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
				message: "Saldo insuficiente para transferência",
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
				message: "Saldo insuficiente para transferência",
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
				message: "Você não pode transferir dinheiro para você mesmo",
			});
        });
    });

	describe("getMoneyTransactionsController", () => {
		it("deve retornar 401 quando não autenticado", async () => {
			delete (mockRequest as any).clientUser;

			await getMoneyTransactionsController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(401);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Unauthorized",
				message: "Token de autenticação inválido ou expirado",
			});
		});

		it("deve retornar 404 quando carteira não encontrada", async () => {
			(UsersService.getUserBalance as jest.Mock).mockResolvedValueOnce(null);

			await getMoneyTransactionsController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Wallet not found",
				message: "Carteira não encontrada",
			});
		});

		it("deve retornar 404 quando transações não encontradas", async () => {
			const wallet = { id: "wallet-123", user_id: "user-123", balance: 0 };
			(UsersService.getUserBalance as jest.Mock).mockResolvedValueOnce(wallet);
			(WalletService.getMoneyTransactions as jest.Mock).mockResolvedValueOnce(null);

			await getMoneyTransactionsController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Transactions not found",
				message: "Transações não encontradas",
			});
		});

		it("deve retornar transações com sucesso", async () => {
			const wallet = { id: "wallet-123", user_id: "user-123", balance: 0 };
			const transactions = [{ id: "tx-1" }, { id: "tx-2" }];
			(UsersService.getUserBalance as jest.Mock).mockResolvedValueOnce(wallet);
			(WalletService.getMoneyTransactions as jest.Mock).mockResolvedValueOnce(transactions);

			await getMoneyTransactionsController(
				mockRequest as FastifyRequest<any>,
				mockReply as FastifyReply
			);

			expect(mockReply.code).toHaveBeenCalledWith(200);
			expect(mockReply.send).toHaveBeenCalledWith(transactions);
		});
	});
});

