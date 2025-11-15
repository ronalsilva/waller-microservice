import { ErrorDeafult } from "@utils/schemaDeafault"

const baseTag = {
    tags: ['User']
}

export const getUserSchema = {
    ...baseTag,
    summary: 'Search a user',
    security: [{ bearerAuth: [] }],
    response: {
        200: {
            id: { type: 'string' },
            first_name: { type: 'string'},
            last_name: { type: 'string'},
            email: { type: 'string'},
            profile_picture: { type: 'string'},
            created_at: { type: 'string'}
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

export const createUserSchema = {
    ...baseTag,
    summary: 'Create a new user',
    body: {
        type: 'object',
        properties: {
            first_name: { type: 'string', minLength: 2 },
            last_name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 4 }
        }
    },
    response: {
        200: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                first_name: { type: 'string'},
                last_name: { type: 'string'},
                email: { type: 'string'},
                profile_picture: { type: 'string'},
                created_at: { type: 'string'}
            }
        },
        404: ErrorDeafult,
        400: ErrorDeafult,
        500: {
            type: 'object',
            properties: {
                code: { type: "string" },
                mensage: { type: "string" },
            }
        },
    },
};

export const updateUserSchema = {
    ...baseTag,
    summary: 'Update a user',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        properties: {
            first_name: { type: 'string', minLength: 2 },
            last_name: { type: 'string', minLength: 2 },
            password: { type: 'string', minLength: 4, nullable: true }
        },
        required: ['first_name', 'last_name'],
        additionalProperties: false
    },
    response: {
        200: {
            type: 'object',
            properties: {
                first_name: { type: 'string'},
                last_name: { type: 'string'},
                email: { type: 'string'},
                profile_picture: { type: 'string'},
                created_at: { type: 'string'}
            }
        },
        404: ErrorDeafult,
        400: ErrorDeafult,
        500: {
            type: 'object',
            properties: {
                code: { type: "string" },
                mensage: { type: "string" },
            }
        },
    },
};

export const deleteUserSchema = {
    ...baseTag,
    summary: 'Delete a user',
    security: [{ bearerAuth: [] }],
    querystring: {
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' }
        },
        required: ['email']
    },
    response: {
        200: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'User deleted successfully' }
            }
        },
        404: ErrorDeafult,
        400: ErrorDeafult,
        500: {
            type: 'object',
            properties: {
                code: { type: "string" },
                mensage: { type: "string" },
            }
        },
    },
};