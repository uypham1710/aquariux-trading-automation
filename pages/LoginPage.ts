import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly demoTab: Locator;
  readonly accountIdInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.demoTab = page.getByTestId('tab-login-account-type-demo');
    this.accountIdInput = page.getByTestId('login-user-id');
    this.passwordInput = page.getByTestId('login-password');
    this.loginButton = page.getByTestId('login-submit');
    this.errorMessage = page.getByTestId('notification-box-description');
  }

  async open() {
    await this.page.goto('/web/login');
  }

  async login(accountId: string, password: string) {
    await this.demoTab.click();
    await this.accountIdInput.fill(accountId);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
