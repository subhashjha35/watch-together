import { Config } from 'jest';

export default {
    displayName: 'backend-socket-backend',
    preset: '../../../jest.preset.cjs',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../../coverage/libs/backend-socket/backend'
} satisfies Config;
