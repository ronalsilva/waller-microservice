import { FastifyRequest, FastifyReply } from 'fastify';
import { validateTokenAndGetUserFromClientService } from '@middleware/kafka/userService';

declare module 'fastify' {
    interface FastifyRequest {
        clientUser?: {
            id: string;
            email?: string;
            [key: string]: any;
        };
    }
}

export async function authenticateClientJWT(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const authHeader = request.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            reply.code(401).send({ error: 'Unauthorized', message: 'Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.substring(7);
        const user = await validateTokenAndGetUserFromClientService(token);
        
        if (!user) {
            reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token' });
            return;
        }
        
        request.clientUser = user;
    } catch (error: any) {
        console.error('Error in authenticateClientJWT:', error);
        reply.code(401).send({ error: 'Unauthorized', message: 'Token verification failed' });
    }
}

