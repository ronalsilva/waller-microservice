require('dotenv').config();

process.env.NODE_ENV = 'TEST';

module.exports = {
	preset: 'ts-jest',
	transform: {
		'^.+\\.(t|j)sx?$': 'ts-jest',
	},
	roots: [
		'<rootDir>/src/test',
	],
	testMatch: [
		'**/controllers/**/*.test.ts',
		'**/controllers/**/*.spec.ts',
		'**/service/**/*.test.ts',
		'**/service/**/*.spec.ts',
	],
	testEnvironment: 'node',
	testPathIgnorePatterns: ['/node_modules/', '/prisma/'],
	coveragePathIgnorePatterns: ['/src/utils/', '/src/test/'],
	moduleFileExtensions: [
		'ts',
		'tsx',
		'js',
		'jsx',
		'json',
		'node',
	],
	moduleNameMapper: {
		'^@service/(.*)$': '<rootDir>/src/service/$1',
		'^@utils/(.*)$': '<rootDir>/src/utils/$1',
		'^@api/(.*)$': '<rootDir>/src/api/$1',
		'^@db/(.*)$': '<rootDir>/src/database/$1',
		'^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
		'^@schemas/(.*)$': '<rootDir>/src/schemas/$1',
		'^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
	},
	verbose: true,
	globals: {
		'ts-jest': {
			disableSourceMapSupport: true,
			tsconfig: {
				baseUrl: './src',
				paths: {
					'@service/*': ['service/*'],
					'@utils/*': ['utils/*'],
					'@api/*': ['api/*'],
					'@db/*': ['database/*'],
					'@controllers/*': ['controllers/*'],
					'@schemas/*': ['schemas/*'],
					'@middleware/*': ['middleware/*'],
				},
			},
		},
	},
};
