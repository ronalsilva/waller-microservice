import { producer } from './config';

export async function sendMessage(topic: string, message: any): Promise<void> {
    try {
        await producer.send({
            topic,
            messages: [
                {
                    value: JSON.stringify(message),
                },
            ],
        });
    } catch (error) {
        console.error('Error sending message to Kafka:', error);
        throw error;
    }
}

export async function requestUserData(userId: string, correlationId: string): Promise<void> {
    const message = {
        action: 'getUserById',
        userId,
        correlationId,
        timestamp: new Date().toISOString(),
    };
    
    await sendMessage('client-microservice-requests', message);
}

export async function validateTokenAndGetUser(token: string, correlationId: string): Promise<void> {
    const message = {
        action: 'validateTokenAndGetUser',
        token,
        correlationId,
        timestamp: new Date().toISOString(),
    };
    
    await sendMessage('client-microservice-requests', message);
}

