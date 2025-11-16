import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

interface ClientMicroserviceJWT {
    id: string;
    email?: string;
    [key: string]: any;
}

export async function validateClientMicroserviceJWT(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<ClientMicroserviceJWT | null> {
    try {
        const authHeader = request.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            reply.code(401).send({ error: 'Unauthorized', message: 'Missing or invalid authorization header' });
            return null;
        }

        const token = authHeader.substring(7);
        const clientJwtSecret = process.env.CLIENT_MICROSERVICE_JWT_SECRET || '';
        
        if (!clientJwtSecret) {
            console.error('CLIENT_MICROSERVICE_JWT_SECRET not configured');
            reply.code(500).send({ error: 'Server configuration error' });
            return null;
        }

        const decoded = jwt.verify(token, clientJwtSecret) as ClientMicroserviceJWT;
        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            reply.code(401).send({ error: 'Unauthorized', message: 'Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            reply.code(401).send({ error: 'Unauthorized', message: 'Invalid token' });
        } else {
            reply.code(401).send({ error: 'Unauthorized', message: 'Token verification failed' });
        }
        return null;
    }
}

