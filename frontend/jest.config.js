module.exports = {
  // Legacy default Jest behavior used the Node environment, where window is undefined.
  // testEnvironment: 'node',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
};
