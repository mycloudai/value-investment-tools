import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  outputDir: '.artifacts/test-results',
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '.artifacts/playwright-report' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev:cf:test',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});