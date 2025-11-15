import buildServer from "./server";
import { FastifyInstance } from "fastify";

const PORT = Number(process.env.PORT) || 3002;

async function startServer(server: FastifyInstance): Promise<void> {
    try {
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