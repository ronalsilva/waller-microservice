import {
  createUserController,
  getUserController,
  updateUserController,
  deleteUserController,
} from '@controllers/Users';
import { createUser, getUser, updateUser, deleteUser } from '@service/Users';
import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '@prisma/client';

// Mock dos módulos
jest.mock('@service/Users');

// Tipos para os mocks
const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockGetUser = getUser as jest.MockedFunction<typeof getUser>;
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
const mockDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>;

describe('Users Controller', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockJwtVerify: jest.Mock;

  beforeEach(() => {
    // Reset dos mocks antes de cada teste
    jest.clearAllMocks();

    // Mock do jwtVerify
    mockJwtVerify = jest.fn().mockResolvedValue({ email: 'test@example.com' });

    // Mock do request
    mockRequest = {
      body: {},
      jwtVerify: mockJwtVerify,
    };

    // Mock do response (FastifyReply)
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('createUserController', () => {
    it('deve criar um usuário com sucesso', async () => {
      // Arrange
      const mockUserData: Partial<User> = {
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

      mockRequest.body = mockUserData;
      mockCreateUser.mockResolvedValue(mockCreatedUser as any);

      // Act
      await createUserController(
        mockRequest as FastifyRequest<{ Body: User }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockCreateUser).toHaveBeenCalledWith(mockReply, mockUserData);
      expect(mockReply.send).toHaveBeenCalledWith(mockCreatedUser);
      expect(mockReply.code).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando o service retornar undefined', async () => {
      // Arrange
      const mockUserData: Partial<User> = {
        email: 'john@example.com',
        password: 'password123',
      };

      mockRequest.body = mockUserData;
      mockCreateUser.mockResolvedValue(undefined);

      // Act
      await createUserController(
        mockRequest as FastifyRequest<{ Body: User }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockCreateUser).toHaveBeenCalledWith(mockReply, mockUserData);
      expect(mockReply.send).toHaveBeenCalledWith(undefined);
    });

    it('deve passar os dados corretos do body para o service', async () => {
      // Arrange
      const mockUserData: Partial<User> = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        password: 'securepassword',
        profile_picture: 'https://example.com/pic.jpg',
      };

      const mockCreatedUser = {
        id: 'user-id-456',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        profile_picture: 'https://example.com/pic.jpg',
        created_at: new Date(),
      };

      mockRequest.body = mockUserData;
      mockCreateUser.mockResolvedValue(mockCreatedUser as any);

      // Act
      await createUserController(
        mockRequest as FastifyRequest<{ Body: User }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockCreateUser).toHaveBeenCalledWith(mockReply, mockUserData);
      expect(mockReply.send).toHaveBeenCalledWith(mockCreatedUser);
    });
  });

  describe('getUserController', () => {
    it('deve retornar o usuário quando o JWT for válido', async () => {
      // Arrange
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

      mockJwtVerify.mockResolvedValue({ email: 'test@example.com' });
      mockGetUser.mockResolvedValue(mockUser as User);

      // Act
      await getUserController(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockReply.send).toHaveBeenCalledWith(mockUser);
      expect(mockReply.code).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando o JWT for inválido', async () => {
      // Arrange
      const jwtError = new Error('Invalid token');
      mockJwtVerify.mockRejectedValue(jwtError);

      // Act & Assert
      await expect(
        getUserController(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Invalid token');

      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('deve usar o email do JWT decodificado para buscar o usuário', async () => {
      // Arrange
      const mockUser: Partial<User> = {
        id: 'user-id-789',
        email: 'different@example.com',
        first_name: 'Different',
        last_name: 'User',
      };

      mockJwtVerify.mockResolvedValue({ email: 'different@example.com' });
      mockGetUser.mockResolvedValue(mockUser as User);

      // Act
      await getUserController(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'different@example.com');
      expect(mockReply.send).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updateUserController', () => {
    it('deve atualizar o usuário com sucesso', async () => {
      // Arrange
      const existingUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      const updateData: Partial<User> = {
        first_name: 'Jane',
        last_name: 'Smith',
      };

      const updatedUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        profile_picture: null,
        created_at: new Date(),
      };

      mockJwtVerify.mockResolvedValue({ email: 'test@example.com' });
      mockGetUser.mockResolvedValue(existingUser as User);
      mockUpdateUser.mockResolvedValue(updatedUser as any);
      mockRequest.body = updateData;

      // Act
      await updateUserController(
        mockRequest as FastifyRequest<{ Body: User }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockUpdateUser).toHaveBeenCalledWith(
        mockReply,
        'test@example.com',
        updateData
      );
      expect(mockReply.send).toHaveBeenCalledWith(updatedUser);
      expect(mockReply.code).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando o usuário não for encontrado', async () => {
      // Arrange
      mockJwtVerify.mockResolvedValue({ email: 'test@example.com' });
      mockGetUser.mockResolvedValue(undefined);
      mockRequest.body = { first_name: 'Jane' };

      // Act
      await updateUserController(
        mockRequest as FastifyRequest<{ Body: User }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('deve retornar erro 404 quando o usuário for null', async () => {
      // Arrange
      mockJwtVerify.mockResolvedValue({ email: 'test@example.com' });
      mockGetUser.mockResolvedValue(null as any);
      mockRequest.body = { first_name: 'Jane' };

      // Act
      await updateUserController(
        mockRequest as FastifyRequest<{ Body: User }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('deve lançar erro quando o JWT for inválido', async () => {
      // Arrange
      const jwtError = new Error('Invalid token');
      mockJwtVerify.mockRejectedValue(jwtError);
      mockRequest.body = { first_name: 'Jane' };

      // Act & Assert
      await expect(
        updateUserController(
          mockRequest as FastifyRequest<{ Body: User }>,
          mockReply as FastifyReply
        )
      ).rejects.toThrow('Invalid token');

      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('deve usar os dados do body para atualizar o usuário', async () => {
      // Arrange
      const existingUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
      };

      const updateData: Partial<User> = {
        first_name: 'Updated',
        last_name: 'Name',
        profile_picture: 'https://example.com/new-pic.jpg',
      };

      const updatedUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        first_name: 'Updated',
        last_name: 'Name',
        profile_picture: 'https://example.com/new-pic.jpg',
        created_at: new Date(),
      };

      mockJwtVerify.mockResolvedValue({ email: 'test@example.com' });
      mockGetUser.mockResolvedValue(existingUser as User);
      mockUpdateUser.mockResolvedValue(updatedUser as any);
      mockRequest.body = updateData;

      // Act
      await updateUserController(
        mockRequest as FastifyRequest<{ Body: User }>,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockUpdateUser).toHaveBeenCalledWith(
        mockReply,
        'test@example.com',
        updateData
      );
      expect(mockReply.send).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('deleteUserController', () => {
    it('deve deletar o usuário com sucesso', async () => {
      // Arrange
      const existingUser: Partial<User> = {
        id: 'user-id-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      mockJwtVerify.mockResolvedValue({ email: 'test@example.com' });
      mockGetUser.mockResolvedValue(existingUser as User);
      mockDeleteUser.mockResolvedValue(undefined);

      // Act
      await deleteUserController(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockDeleteUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockReply.send).toHaveBeenCalledWith(undefined);
      expect(mockReply.code).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 quando o usuário não for encontrado', async () => {
      // Arrange
      mockJwtVerify.mockResolvedValue({ email: 'test@example.com' });
      mockGetUser.mockResolvedValue(undefined);

      // Act
      await deleteUserController(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockDeleteUser).not.toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('deve retornar erro 404 quando o usuário for null', async () => {
      // Arrange
      mockJwtVerify.mockResolvedValue({ email: 'test@example.com' });
      mockGetUser.mockResolvedValue(null as any);

      // Act
      await deleteUserController(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).toHaveBeenCalledWith(mockReply, 'test@example.com');
      expect(mockDeleteUser).not.toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('deve lançar erro quando o JWT for inválido', async () => {
      // Arrange
      const jwtError = new Error('Invalid token');
      mockJwtVerify.mockRejectedValue(jwtError);

      // Act & Assert
      await expect(
        deleteUserController(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow('Invalid token');

      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('deve usar o email do usuário encontrado para deletar', async () => {
      // Arrange
      const existingUser: Partial<User> = {
        id: 'user-id-456',
        email: 'different@example.com',
        first_name: 'Different',
        last_name: 'User',
      };

      mockJwtVerify.mockResolvedValue({ email: 'different@example.com' });
      mockGetUser.mockResolvedValue(existingUser as User);
      mockDeleteUser.mockResolvedValue(undefined);

      // Act
      await deleteUserController(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // Assert
      expect(mockDeleteUser).toHaveBeenCalledWith(mockReply, 'different@example.com');
      expect(mockReply.send).toHaveBeenCalledWith(undefined);
    });
  });
});
