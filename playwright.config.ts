import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config for the HIVE portal.
 *
 * Browser: we drive the Microsoft Edge already installed on the machine via
 * `channel`, so `npm install` never downloads a ~150MB Chromium. If Edge is
 * missing, set E2E_CHANNEL=chrome, or run `npx playwright install chromium`
 * and set E2E_CHANNEL= (empty) to fall back to the bundled browser.
 */
const channel = process.env.E2E_CHANNEL ?? 'msedge'

export default defineConfig({
  testDir: './tests/e2e',
  // Vite's base path — every page lives under /hive-portal/.
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Scroll-driven and spring-settled assertions deserve one retry.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],

  use: {
    baseURL: 'http://localhost:5173/hive-portal/',
    ...(channel ? { channel } : {}),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Edge'], channel, viewport: { width: 1440, height: 900 } },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/hive-portal/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
