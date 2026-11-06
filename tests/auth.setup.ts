import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TradePage } from '../pages/TradePage';
import { requireEnv, AUTH_FILE } from '../utils/env';

// Runs once before all specs (see "setup" project in playwright.config.ts).
// Logging in through the UI for every test would be slow and could trigger
// login rate limits on the shared demo account.
setup('authenticate demo account', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const tradePage = new TradePage(page);

  await loginPage.open();
  await loginPage.login(requireEnv('DEMO_USERNAME'), requireEnv('DEMO_PASSWORD'));

  // Wait for a logged-in-only element so the saved state contains a valid session.
  await expect(tradePage.equity).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
