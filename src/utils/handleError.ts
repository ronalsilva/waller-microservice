import { FastifyReply } from "fastify";

// ESSE COMENTARIO NAO FOI GERADO POR IA :) HAHA - FOI GERADO POR MIM RONALD 
// FUNCAO CRIADA PARA MANIPULAR ERROS GERADOS PELO PRISMA
// DOC PRISMA: https://www.prisma.io/docs/orm/reference/error-reference
function handleError(err: any, response: FastifyReply): void {
    console.error("Database error:", err);
    switch (err.code) {
        case "P1000":
            response.code(500).send({
                error: 500,
                message: "Autenticação falhou no servidor de banco de dados"
            });
            break;
        case "P1001":
        case "P1002":
            response.code(500).send({
                error: 500,
                message: "Não foi possível conectar ao servidor de banco de dados"
            });
            break;
        case "P1008":
            response.code(504).send({
                error: 504,
                message: "Operação de banco de dados atingiu o tempo limite"
            });
            break;
        case "P1017":
            response.code(500).send({
                error: 500,
                message: "Servidor fechou a conexão"
            });
            break;
        case "P2000":
            response.code(400).send({
                error: 400,
                message: "O valor fornecido para a coluna é muito longo"
            });
            break;
        case "P2002":
            response.code(409).send({
                error: 409,
                message: `Já existe um usuário com este email`
            });
            break;
        case "P2003":
            response.code(400).send({
                error: 400,
                message: `Erro ao criar usuário: ${err.meta?.field_name}`
            });
            break;
        case "P2025":
            response.code(404).send({
                error: 404,
                message: "Usuário não encontrado"
            });
            break;
        case "P2011":
            response.code(400).send({
                error: 400,
                message: "Erro ao criar usuário"
            });
            break;
        case "P2012":
            response.code(400).send({
                error: 400,
                message: "Esta faltando um valor obrigatório"
            });
            break;
        case "P2014":
            response.code(400).send({
                error: 400,
                message: "A alteração que você está tentando fazer violaria uma relação obrigatória"
            });
            break;
        case "P2024":
            response.code(503).send({
                error: 503,
                message: "Tempo esgotado ao buscar uma nova conexão do pool de conexões"
            });
            break;
        case "404":
            if (err.message) {
                response.code(404).send({
                    error: 404,
                    message: err.message
                });
            } else {
                response.code(404).send({
                    error: 404,
                    message: "Recurso não encontrado"
                });
            }
            response.code(404).send({
                error: 404,
                message: err.message
            });
            break;
        default:
            response.code(500).send({
                error: 500,
                message: "Erro interno do servidor"
            });
            break;
    }
}

export default handleError;
