import { ErrorDeafult } from "@utils/schemaDeafault"

const baseTag = {
    tags: ['Wallet']
}

export const createWalletSchema = {
    ...baseTag,
    summary: 'Create a new wallet for user',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        properties: {
            balance: { type: 'number', default: 0 }
        },
    },
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

export const depositMoneySchema = {
    ...baseTag,
    summary: 'Deposit money into wallet',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        properties: {
            amount: { type: 'number' }
        },
    },
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

export const transferMoneySchema = {
    ...baseTag,
    summary: 'Transfer money between wallets',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        properties: {
            amount: { type: 'number' },
            receiver_id: { type: 'string' }
        },
    },
    response: {
        200: {
            type: 'object',
            properties: {
                sender_wallet_id: { type: 'string' },
                receiver_wallet_id: { type: 'string' },
                amount: { type: 'number' },
                type: { type: 'string', enum: ['transfer'] },
                description: { type: 'string' },
                created_by: { type: 'string' },
                updated_by: { type: 'string' },
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