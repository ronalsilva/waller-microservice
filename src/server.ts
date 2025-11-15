import path from "path";
import * as fs from "fs";
import env from "dotenv";
import fastify, { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors"
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import {swaggerOptions} from "@utils/swaggerConfig"
import fjwt, { JWT } from "@fastify/jwt";

env.config();

declare module "fastify" {
    interface FastifyRequest {
        jwt: JWT;
    }
	export interface FastifyInstance {
		authenticate: any;
	}
}

export default function buildServer(): FastifyInstance {
    const server = fastify();
    server.register(cors, {
        origin: "*",
        allowedHeaders: [
            "Origin",
            "X-Requested-With",
            "Accept",
            "Content-Type",
            "Authorization",
        ],
        methods: ["GET", "PUT", "POST", "DELETE"],
    })
    server.register(fastifySwagger, swaggerOptions)
    server.register(fastifySwaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'none',
            deepLinking: false
        },
        uiHooks: {
            onRequest: function (request, reply, next) { next() },
            preHandler: function (request, reply, next) { next() }
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
        transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
        transformSpecificationClone: true
    })
    server.register(fjwt, {
		secret: process.env.JWT_SECRET || "",
	});
    server.addHook("preHandler", (req, reply, next) => {
		req.jwt = server.jwt as JWT;
		next();
	});
    server.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (error) {
            reply.code(401).send({ error: "Unauthorized", message: "Invalid or expired token" });
        }
    });

    const apiPath = path.join(__dirname, "api");
	const apis = fs.readdirSync(apiPath);

    apis.forEach((api) => {
		const apiItemPath = path.join(apiPath, api);
		const stats = fs.statSync(apiItemPath);
		
		let routeName: string;
		let modulePath: string;
		
		if (stats.isFile() && api.endsWith('.ts')) {
			routeName = api.replace('.ts', '');
			modulePath = apiItemPath;
		} else if (stats.isDirectory()) {
			routeName = api;
			modulePath = path.join(apiItemPath, 'index.ts');
		} else {
			return;
		}
		
		try {
			const apiModule = require(modulePath);
			const apiRoutes: FastifyPluginAsync = apiModule?.default;
			
			if (!apiRoutes) {
				console.warn(`Warning: ${api}: No default export found`);
				return;
			}
			
			server.register(apiRoutes, { prefix: `api/${routeName.toLowerCase()}` });
		} catch (error) {
			console.error(`Error loading ${api}:`, error);
		}
	});

    return server;
}