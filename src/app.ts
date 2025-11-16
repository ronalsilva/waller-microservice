import buildServer from "./server";
import { FastifyInstance } from "fastify";
import { producer } from "@middleware/kafka/config";
import { startConsumer } from "@middleware/kafka/consumer";

const PORT = Number(process.env.PORT) || 3001;

async function startServer(server: FastifyInstance): Promise<void> {
    try {
        try {
            await producer.connect();
            console.log('Kafka producer connected');
            const { CONNECT, DISCONNECT } = producer.events;
            
            producer.on(CONNECT, () => {
                console.log('Kafka producer reconnected');
            });

            producer.on(DISCONNECT, () => {
                console.warn('Kafka producer disconnected');
            });
        } catch (error) {
            console.error(`Error connecting Kafka producer:`, error);
        }
        
        await startConsumer(server);
        
        await server.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Server ready at http://localhost:${PORT}`);
    } catch (error: any) {
        if (error?.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use.`);
        } else {
            console.error("Error starting server:", error);
        }
        process.exit(1);
    }
}

async function main() {
    const server = buildServer();
    await startServer(server);   
}

main();