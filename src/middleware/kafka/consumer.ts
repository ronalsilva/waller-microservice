import { consumer } from './config';
import { FastifyInstance } from 'fastify';

interface UserDataResponse {
    correlationId: string;
    user?: {
        id: string;
        email?: string;
        name?: string;
        [key: string]: any;
    };
    error?: string;
    message?: string;
}

const pendingRequests = new Map<string, {
    resolve: (value: UserDataResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
}>();

export function setupConsumer(server: FastifyInstance): void {
    consumer.subscribe({ topic: 'client-microservice-responses', fromBeginning: false });
    
    consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const rawMessage = message.value?.toString() || '{}';
                const data = JSON.parse(rawMessage) as UserDataResponse;
                
                if (data.correlationId && pendingRequests.has(data.correlationId)) {
                    const request = pendingRequests.get(data.correlationId)!;
                    clearTimeout(request.timeout);
                    pendingRequests.delete(data.correlationId);
                    
                    if (data.error) {
                        request.reject(new Error(data.error));
                    } else {
                        request.resolve(data);
                    }
                } else {
                    console.warn('[Kafka Consumer] No matching correlationId found or correlationId missing');
                }
            } catch (error) {
                console.error('[Kafka Consumer] Message value:', message.value?.toString());
            }
        },
    });
}

export function waitForUserData(correlationId: string, timeout: number = 5000): Promise<UserDataResponse> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            pendingRequests.delete(correlationId);
            reject(new Error('Timeout waiting for user data from client-microservice'));
        }, timeout);

        pendingRequests.set(correlationId, {
            resolve,
            reject,
            timeout: timeoutId,
        });
    });
}

export async function startConsumer(server: FastifyInstance): Promise<void> {
    try {
        await consumer.connect();
        setupConsumer(server);
        console.log('Kafka consumer connected and listening');
        
        const { CONNECT, DISCONNECT, CRASH } = consumer.events;
        
        consumer.on(CONNECT, () => {
            console.log('Kafka consumer reconnected');
        });

        consumer.on(DISCONNECT, () => {
            console.warn('Kafka consumer disconnected, will attempt to reconnect');
        });

        consumer.on(CRASH, async (event: any) => {
            console.error('Kafka consumer crashed:', event?.payload?.error || event);
            setTimeout(async () => {
                try {
                    await consumer.connect();
                    setupConsumer(server);
                    console.log('Kafka consumer reconnected after crash');
                } catch (error) {
                    console.error('Failed to reconnect consumer:', error);
                }
            }, 5000);
        });

        return;
    } catch (error) {
        console.error(`Error starting Kafka consumer:`, error);
        throw error;
    }
}

