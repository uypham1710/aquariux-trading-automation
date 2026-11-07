import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TradePage } from '../pages/TradePage';
import { requireEnv, AUTH_FILE } from '../utils/env';

setup('authenticate demo account', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const tradePage = new TradePage(page);

  await loginPage.open();
  await loginPage.login(requireEnv('DEMO_USERNAME'), requireEnv('DEMO_PASSWORD'));

  await expect(tradePage.equity).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
