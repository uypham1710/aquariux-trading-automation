import { test, expect } from '@playwright/test';
import { TradePage } from '../pages/TradePage';
import { LoginPage } from '../pages/LoginPage';

test.describe('Smoke', () => {
  test('should open trade page as logged-in user without seeing login form @smoke', async ({ page }) => {
    const tradePage = new TradePage(page);
    const loginPage = new LoginPage(page);

    await tradePage.open();

    await expect(tradePage.equity).toBeVisible();
    await expect(loginPage.loginButton).toBeHidden();
  });
});
