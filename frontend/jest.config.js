module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/tests/'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
