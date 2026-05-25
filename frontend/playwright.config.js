import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.', 
  testMatch: [
    '**/*.spec.js',
    '**/*.test.js'
  ],
  use: {
    baseURL: 'http://localhost:3000',
    headless: false
  }
});