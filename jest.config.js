module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/src/**/*.test.js',
        '**/src/**/*.spec.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/*.spec.js',
        '!src/testRunner.js',
        '!src/Main.test.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    setupFilesAfterEnv: ['<rootDir>/src/testSetup.js']
};
