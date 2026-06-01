const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'python3 -m http.server 4173',
    port: 4173,
    reuseExistingServer: true,
  },
});
