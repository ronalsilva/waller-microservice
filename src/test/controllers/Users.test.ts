import { FastifyRequest, FastifyReply } from "fastify";
import { getUserBalanceController } from "@controllers/Users";
import * as UsersService from "@service/Users";
import { getUserByIdFromClientService } from "@middleware/kafka/userService";

jest.mock("@service/Users");
jest.mock("@middleware/kafka/userService", () => ({
	getUserByIdFromClientService: jest.fn().mockResolvedValue({ id: "any-user" }),
}));

describe("Users Controller", () => {
    let mockRequest: Partial<FastifyRequest>;
    let mockReply: Partial<FastifyReply>;

    beforeEach(() => {
        mockRequest = {
			clientUser: { id: "user-123" } as any,
        };

        mockReply = {
            code: jest.fn().mockReturnThis(),
			status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

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

            (UsersService.getUserBalance as jest.Mock).mockResolvedValue(mockWallet);

            await getUserBalanceController(
                mockRequest as FastifyRequest,
                mockReply as FastifyReply
            );

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

			mockRequest.clientUser = { id: "user-456" } as any;
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

		it("deve retornar 401 quando não autenticado", async () => {
			delete (mockRequest as any).clientUser;

			await getUserBalanceController(
				mockRequest as FastifyRequest,
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

			await getUserBalanceController(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({
				error: "Usuário não encontrado",
				message: "Usuário não encontrado no client-microservice",
			});
		});

		it("deve retornar 404 quando carteira não encontrada", async () => {
			(UsersService.getUserBalance as jest.Mock).mockResolvedValueOnce(null);

			await getUserBalanceController(
				mockRequest as FastifyRequest,
				mockReply as FastifyReply
			);

			expect(mockReply.status).toHaveBeenCalledWith(404);
			expect(mockReply.send).toHaveBeenCalledWith({ error: "Carteira não encontrada" });
		});
    });
});

