import { createUser, getUser, updateUser, deleteUser } from '@service/Users';
import handleError from '@utils/handleError';
import { hashPassword } from '@utils/hash';
import { FastifyReply } from 'fastify';
import { User } from '@prisma/client';

// Mock dos módulos
jest.mock('@utils/dbConnection', () => {
  const mockUser = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      user: mockUser,
    },
  };
});

jest.mock('@utils/handleError');
jest.mock('@utils/hash');

// Importar prisma após o mock
import prisma from '@utils/dbConnection';

// Mock dos módulos
const mockHandleError = handleError as jest.MockedFunction<typeof handleError>;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe('Users Service', () => {
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    // Reset dos mocks antes de cada teste
    jest.clearAllMocks();

    // Mock do response (FastifyReply)
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Mock padrão do hashPassword
    mockHashPassword.mockReturnValue({
      hash: 'hashed-password',
      salt: 'salt-value',
    });
  });

  describe('createUser', () => {
    it('deve criar um usuário com sucesso', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        id: 'user-id-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        profile_picture: null,
        created_at: new Date(),
      };

      const mockCreatedUser = {
        id: 'user-id-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        profile_picture: null,
        created_at: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      // Act
      const result = await createUser(mockReply as FastifyReply, mockUser as User);

      // Assert
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...mockUser,
          password: 'hashed-password',
          salt: 'salt-value',
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_picture: true,
          created_at: true,
        },
      });
      expect(result).toEqual(mockCreatedUser);
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('deve chamar handleError quando ocorrer um erro P2002 (email duplicado)', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        email: 'existing@example.com',
        password: 'password123',
      };

      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] },
      };

      (prisma.user.create as jest.Mock).mockRejectedValue(prismaError);

      // Act
      const result = await createUser(mockReply as FastifyReply, mockUser as User);

      // Assert
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(prismaError, mockReply);
      expect(result).toBeUndefined();
    });

    it('deve chamar handleError quando ocorrer um erro P2012 (valor obrigatório faltando)', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        email: 'test@example.com',
        password: 'password123',
        // Faltando campos obrigatórios
      };

      const prismaError = {
        code: 'P2012',
        meta: {},
      };

      (prisma.user.create as jest.Mock).mockRejectedValue(prismaError);

      // Act
      const result = await createUser(mockReply as FastifyReply, mockUser as User);

      // Assert
      expect(mockHashPassword).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(prismaError, mockReply);
      expect(result).toBeUndefined();
    });

    it('deve chamar handleError quando ocorrer um erro genérico', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        email: 'test@example.com',
        password: 'password123',
      };

      const genericError = {
        code: 'UNKNOWN_ERROR',
        message: 'Erro desconhecido',
      };

      (prisma.user.create as jest.Mock).mockRejectedValue(genericError);

      // Act
      const result = await createUser(mockReply as FastifyReply, mockUser as User);

      // Assert
      expect(mockHashPassword).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(genericError, mockReply);
      expect(result).toBeUndefined();
    });

    it('deve usar o hash e salt gerados pelo hashPassword', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      const mockCreatedUser = {
        id: 'user-id-123',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        profile_picture: null,
        created_at: new Date(),
      };

      mockHashPassword.mockReturnValue({
        hash: 'custom-hash',
        salt: 'custom-salt',
      });

      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      // Act
      await createUser(mockReply as FastifyReply, mockUser as User);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...mockUser,
          password: 'custom-hash',
          salt: 'custom-salt',
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_picture: true,
          created_at: true,
        },
      });
    });
  });

  describe('getUser', () => {
    it('deve retornar um usuário quando encontrado', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockUser: Partial<User> = {
        id: 'user-id-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'test@example.com',
        password: 'hashed-password',
        salt: 'salt-value',
        profile_picture: null,
        created_at: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser as User);

      // Act
      const result = await getUser(mockReply as FastifyReply, email);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_picture: true,
          created_at: true,
          salt: true,
          password: true,
        },
      });
      expect(result).toEqual(mockUser);
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('deve retornar null quando o usuário não for encontrado', async () => {
      // Arrange
      const email = 'notfound@example.com';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await getUser(mockReply as FastifyReply, email);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_picture: true,
          created_at: true,
          salt: true,
          password: true,
        },
      });
      expect(result).toBeNull();
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('deve chamar handleError quando ocorrer um erro de conexão (P1001)', async () => {
      // Arrange
      const email = 'test@example.com';
      const prismaError = {
        code: 'P1001',
        message: 'Conexão falhou',
      };

      (prisma.user.findUnique as jest.Mock).mockRejectedValue(prismaError);

      // Act
      const result = await getUser(mockReply as FastifyReply, email);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(prismaError, mockReply);
      expect(result).toBeUndefined();
    });

    it('deve chamar handleError quando ocorrer um erro genérico', async () => {
      // Arrange
      const email = 'test@example.com';
      const genericError = {
        code: 'UNKNOWN_ERROR',
        message: 'Erro desconhecido',
      };

      (prisma.user.findUnique as jest.Mock).mockRejectedValue(genericError);

      // Act
      const result = await getUser(mockReply as FastifyReply, email);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(genericError, mockReply);
      expect(result).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('deve atualizar um usuário com sucesso', async () => {
      // Arrange
      const email = 'test@example.com';
      const updateData: Partial<User> = {
        first_name: 'Jane',
        last_name: 'Smith',
        profile_picture: 'https://example.com/pic.jpg',
      };

      const mockUpdatedUser = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'test@example.com',
        profile_picture: 'https://example.com/pic.jpg',
        created_at: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await updateUser(mockReply as FastifyReply, email, updateData);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email },
        data: updateData,
        select: {
          first_name: true,
          last_name: true,
          email: true,
          profile_picture: true,
          created_at: true,
        },
      });
      expect(result).toEqual(mockUpdatedUser);
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('deve chamar handleError quando o usuário não for encontrado (P2025)', async () => {
      // Arrange
      const email = 'notfound@example.com';
      const updateData: Partial<User> = {
        first_name: 'Jane',
      };

      const prismaError = {
        code: 'P2025',
        meta: {},
      };

      (prisma.user.update as jest.Mock).mockRejectedValue(prismaError);

      // Act
      const result = await updateUser(mockReply as FastifyReply, email, updateData);

      // Assert
      expect(prisma.user.update).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(prismaError, mockReply);
      expect(result).toBeUndefined();
    });

    it('deve chamar handleError quando ocorrer um erro P2000 (valor muito longo)', async () => {
      // Arrange
      const email = 'test@example.com';
      const updateData: Partial<User> = {
        first_name: 'A'.repeat(1000), // Valor muito longo
      };

      const prismaError = {
        code: 'P2000',
        meta: {},
      };

      (prisma.user.update as jest.Mock).mockRejectedValue(prismaError);

      // Act
      const result = await updateUser(mockReply as FastifyReply, email, updateData);

      // Assert
      expect(prisma.user.update).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(prismaError, mockReply);
      expect(result).toBeUndefined();
    });

    it('deve atualizar apenas os campos fornecidos', async () => {
      // Arrange
      const email = 'test@example.com';
      const updateData: Partial<User> = {
        first_name: 'Updated Name',
      };

      const mockUpdatedUser = {
        first_name: 'Updated Name',
        last_name: 'Doe',
        email: 'test@example.com',
        profile_picture: null,
        created_at: new Date(),
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      // Act
      await updateUser(mockReply as FastifyReply, email, updateData);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email },
        data: updateData,
        select: {
          first_name: true,
          last_name: true,
          email: true,
          profile_picture: true,
          created_at: true,
        },
      });
    });

    it('deve chamar handleError quando ocorrer um erro genérico', async () => {
      // Arrange
      const email = 'test@example.com';
      const updateData: Partial<User> = {
        first_name: 'Jane',
      };

      const genericError = {
        code: 'UNKNOWN_ERROR',
        message: 'Erro desconhecido',
      };

      (prisma.user.update as jest.Mock).mockRejectedValue(genericError);

      // Act
      const result = await updateUser(mockReply as FastifyReply, email, updateData);

      // Assert
      expect(prisma.user.update).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(genericError, mockReply);
      expect(result).toBeUndefined();
    });
  });

  describe('deleteUser', () => {
    it('deve deletar um usuário com sucesso', async () => {
      // Arrange
      const email = 'test@example.com';

      (prisma.user.delete as jest.Mock).mockResolvedValue({} as User);

      // Act
      await deleteUser(mockReply as FastifyReply, email);

      // Assert
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockHandleError).not.toHaveBeenCalled();
    });

    it('deve chamar handleError e lançar erro quando o usuário não for encontrado (P2025)', async () => {
      // Arrange
      const email = 'notfound@example.com';
      const prismaError = {
        code: 'P2025',
        meta: {},
      };

      (prisma.user.delete as jest.Mock).mockRejectedValue(prismaError);

      // Act & Assert
      await expect(deleteUser(mockReply as FastifyReply, email)).rejects.toThrow(
        'Erro ao deletar usuário'
      );

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockHandleError).toHaveBeenCalledWith(prismaError, mockReply);
    });

    it('deve chamar handleError e lançar erro quando ocorrer um erro de conexão (P1001)', async () => {
      // Arrange
      const email = 'test@example.com';
      const prismaError = {
        code: 'P1001',
        message: 'Conexão falhou',
      };

      (prisma.user.delete as jest.Mock).mockRejectedValue(prismaError);

      // Act & Assert
      await expect(deleteUser(mockReply as FastifyReply, email)).rejects.toThrow(
        'Erro ao deletar usuário'
      );

      expect(prisma.user.delete).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(prismaError, mockReply);
    });

    it('deve chamar handleError e lançar erro quando ocorrer um erro genérico', async () => {
      // Arrange
      const email = 'test@example.com';
      const genericError = {
        code: 'UNKNOWN_ERROR',
        message: 'Erro desconhecido',
      };

      (prisma.user.delete as jest.Mock).mockRejectedValue(genericError);

      // Act & Assert
      await expect(deleteUser(mockReply as FastifyReply, email)).rejects.toThrow(
        'Erro ao deletar usuário'
      );

      expect(prisma.user.delete).toHaveBeenCalled();
      expect(mockHandleError).toHaveBeenCalledWith(genericError, mockReply);
    });

    it('deve sempre lançar erro após chamar handleError', async () => {
      // Arrange
      const email = 'test@example.com';
      const prismaError = {
        code: 'P2003',
        meta: {},
      };

      (prisma.user.delete as jest.Mock).mockRejectedValue(prismaError);

      // Act & Assert
      await expect(deleteUser(mockReply as FastifyReply, email)).rejects.toThrow(
        'Erro ao deletar usuário'
      );

      expect(mockHandleError).toHaveBeenCalled();
    });
  });
});
