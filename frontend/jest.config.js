module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest"
  },
  moduleNameMapper: {
    "\\.(css|less|scss)$": "identity-obj-proxy"
  },
  testMatch: [
    "**/__tests__/unit/**/*.test.js",
    "**/__tests__/integration/**/*.test.js"
  ],
  setupFilesAfterEnv: ["@testing-library/jest-dom"]
};