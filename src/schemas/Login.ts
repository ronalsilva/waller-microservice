const baseTag = {
    tags: ['Login']
}

export const loginSchema = {
    ...baseTag,
    summary: 'Login de acesso',
    body: {
        type: 'object',
        properties: {
            email: { 
                type: 'string', 
                format: 'email',
                minLength: 5,
                maxLength: 255
            },
            password: { 
                type: 'string',
                minLength: 8,
                maxLength: 64
            },
        },
        required: ['email', 'password'],
        additionalProperties: false
    },
    response: {
        200: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' }
            }
        },
    },
};
