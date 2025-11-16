import { requestUserData, validateTokenAndGetUser } from './producer';
import { waitForUserData } from './consumer';
import { randomUUID } from 'crypto';

interface User {
    id: string;
    email?: string;
    name?: string;
    [key: string]: any;
}

export async function getUserByIdFromClientService(userId: string): Promise<User | null> {
    const correlationId = randomUUID();
    
    try {
        await requestUserData(userId, correlationId);
        const response = await waitForUserData(correlationId, 5000);
        
        if (response.error || !response.user) {
            return null;
        }
        
        return response.user;
    } catch (error) {
        console.error('Error getting user from client-microservice:', error);
        return null;
    }
}

export async function validateTokenAndGetUserFromClientService(token: string): Promise<User | null> {
    const correlationId = randomUUID();
    
    try {
        const responsePromise = waitForUserData(correlationId, 10000);
        await new Promise(resolve => setTimeout(resolve, 10));
        await validateTokenAndGetUser(token, correlationId);
        
        const response = await responsePromise;
        if (response.error || !response.user) {
            return null;
        }
        
        return response.user;
    } catch (error) {
        return null;
    }
}

