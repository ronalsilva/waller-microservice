import { ErrorDeafult } from "@utils/schemaDeafault"

const baseTag = {
    tags: ['User']
}

export const getUserBalanceSchema = {
    ...baseTag,
    summary: 'Get user balance',
    security: [{ bearerAuth: [] }],
    response: {
        200: {
            type: 'object',
            properties: {
                balance: { type: 'number' },
                created_at: { type: 'string' },
                updated_at: { type: 'string' }
            }
        },
        404: ErrorDeafult,
        400: ErrorDeafult,
        500: {
            type: 'object',
            properties: {
                error: { type: "string" },
                mensage: { type: "string" },
            }
        },
    },
};