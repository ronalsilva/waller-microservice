import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'Clients Ilia - Swagger',
            description: 'Clients Ilia API - Create by Ronald Junger',
            version: '0.0.1'
        },
        servers: [
            {
                url: 'http://localhost:3002',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        externalDocs: {
            url: 'https://swagger.io',
            description: 'Find more info here'
        }
    }
}