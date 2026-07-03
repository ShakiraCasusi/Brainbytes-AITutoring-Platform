module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    'db-persistence.test.js',
    'chat.test.js',
  ],
  testTimeout: 30000,
};