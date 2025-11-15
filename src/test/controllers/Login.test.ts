import { loginController } from '@controllers/Login';
import { getUser } from '@service/Users';
import { verifyPassword } from '@utils/hash';
import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '@prisma/client';

// Mock dos módulos
jest.mock('@service/Users');
jest.mock('@utils/hash');

// Tipos para os mocks
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;
const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;

describe('Login Controller', () => {
  let mockRequest: Partial<FastifyRequest<{ Body: { email: string; password: string } }>>;
  let mockReply: Partial<FastifyReply>;
  let mockJwt: { sign: jest.Mock };

  beforeEach(() => {
    // Reset dos mocks antes de cada teste
    jest.clearAllMocks();

    // Mock do JWT
    mockJwt = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    };

    // Mock do request
    mockRequest = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
      jwt: mockJwt as any,
    };

    // Mock do response (FastifyReply)
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('Login bem-sucedido', () => {
    it('deve retornar um token de acesso quando as credenciais estiverem corretas', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashed-password',
        salt: 'salt-value',
      };

      mockGetUser.mockResolvedValue(mockUser as User);
      mockVerifyPassword.mockReturnValue(true);

      // Act
      await loginController(
        mockRequest as FastifyRequest<{ Body: { email: string; password: string } }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockGetUser).toHaveBeenCalledTimes(2);
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockVerifyPassword).toHaveBeenCalledWith({
        candidatePassword: 'password123',
        salt: 'salt-value',
        hash: 'hashed-password',
      });
      expect(mockJwt.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        salt: 'salt-value',
        id: 'user-id-123',
      });
      expect(mockReply.send).toHaveBeenCalledWith({
        user: 'test@example.com',
        accessToken: 'mock-access-token',
        refreshToken: 'salt-value',
      });
      expect(mockReply.code).not.toHaveBeenCalled();
    });
  });

  describe('Erro: Usuário não encontrado', () => {
    it('deve retornar erro 401 quando o usuário não for encontrado', async () => {
      // Arrange
      mockGetUser.mockResolvedValue(undefined);

      // Act
      await loginController(
        mockRequest as FastifyRequest<{ Body: { email: string; password: string } }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockVerifyPassword).not.toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'User not found',
      });
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });

    it('deve retornar erro 401 quando o usuário for null', async () => {
      // Arrange
      mockGetUser.mockResolvedValue(null as any);

      // Act
      await loginController(
        mockRequest as FastifyRequest<{ Body: { email: string; password: string } }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockVerifyPassword).not.toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'User not found',
      });
    });
  });

  describe('Erro: Senha incorreta', () => {
    it('deve retornar erro 401 quando a senha estiver incorreta', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashed-password',
        salt: 'salt-value',
      };

      mockGetUser.mockResolvedValue(mockUser as User);
      mockVerifyPassword.mockReturnValue(false);

      // Act
      await loginController(
        mockRequest as FastifyRequest<{ Body: { email: string; password: string } }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockGetUser).toHaveBeenCalledTimes(2);
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockVerifyPassword).toHaveBeenCalledWith({
        candidatePassword: 'password123',
        salt: 'salt-value',
        hash: 'hashed-password',
      });
      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'UNAUTHORIZED',
        message: 'Email ou senha incorretos',
      });
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('Validação de dados', () => {
    it('deve usar o email e senha do body da requisição', async () => {
      // Arrange
      mockRequest.body = {
        email: 'different@example.com',
        password: 'different-password',
      };

      const mockUser: Partial<User> = {
        id: 'user-id-123',
        email: 'different@example.com',
        password: 'hashed-password',
        salt: 'salt-value',
      };

      mockGetUser.mockResolvedValue(mockUser as User);
      mockVerifyPassword.mockReturnValue(true);

      // Act
      await loginController(
        mockRequest as FastifyRequest<{ Body: { email: string; password: string } }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'different@example.com');
      expect(mockVerifyPassword).toHaveBeenCalledWith({
        candidatePassword: 'different-password',
        salt: 'salt-value',
        hash: 'hashed-password',
      });
    });

    it('deve garantir que o token JWT seja gerado com os dados corretos do usuário', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        id: 'specific-user-id',
        email: 'specific@example.com',
        password: 'hashed-password',
        salt: 'specific-salt',
      };

      mockGetUser.mockResolvedValue(mockUser as User);
      mockVerifyPassword.mockReturnValue(true);

      // Act
      await loginController(
        mockRequest as FastifyRequest<{ Body: { email: string; password: string } }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockJwt.sign).toHaveBeenCalledWith({
        email: 'specific@example.com',
        salt: 'specific-salt',
        id: 'specific-user-id',
      });
    });
  });

  describe('Estrutura de resposta', () => {
    it('deve retornar a estrutura correta de resposta em caso de sucesso', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
        password: 'hashed-password',
        salt: 'salt-value',
      };

      mockGetUser.mockResolvedValue(mockUser as User);
      mockVerifyPassword.mockReturnValue(true);

      // Act
      await loginController(
        mockRequest as FastifyRequest<{ Body: { email: string; password: string } }>,
        mockReply as FastifyReply
      );

      // Assert
      const sendCall = (mockReply.send as jest.Mock).mock.calls[0][0];
      expect(sendCall).toHaveProperty('user');
      expect(sendCall).toHaveProperty('accessToken');
      expect(sendCall).toHaveProperty('refreshToken');
      expect(typeof sendCall.accessToken).toBe('string');
      expect(typeof sendCall.refreshToken).toBe('string');
      expect(sendCall.user).toBe('test@example.com');
    });
  });
});
