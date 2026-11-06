import { defineConfig, devices } from '@playwright/test';
import { requireEnv, AUTH_FILE } from './utils/env';

export default defineConfig({
  testDir: './tests',

  // All tests share one demo account. Running in parallel would let one test's
  // orders and positions show up in another test's tables and break ID tracking.
  fullyParallel: false,
  workers: 1,

  // The demo site is reached over a VPN from Vietnam, so every server round trip
  // is slower than usual. One trading test makes several (place order, verify in
  // a table, clean up), which does not fit Playwright's default 30s per test.
  timeout: 90_000,
  // Toasts and table rows appear only after the server confirms the order;
  // over the VPN that can take longer than the default 5s.
  expect: { timeout: 15_000 },

  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: requireEnv('BASE_URL'),
    // First load of /web/trade downloads the whole trading app and opens the
    // live price stream, which is slow over the VPN.
    navigationTimeout: 45_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
  ],
});
