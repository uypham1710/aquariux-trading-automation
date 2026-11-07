import { Page, Locator } from '@playwright/test';

export class SettingsMenu {
  readonly page: Page;
  readonly gearButton: Locator;
  readonly logOutOption: Locator;
  readonly oneClickTradingOffToggle: Locator;
  readonly oneClickTradingOnToggle: Locator;
  readonly oneClickTermsDialog: Locator;
  readonly agreeAndContinueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.gearButton = page.getByTestId('app-setting-dropdown-trigger');
    this.logOutOption = page.getByTestId('setting-option-logout');
    this.oneClickTradingOffToggle = page.getByTestId('toggle-oct');
    this.oneClickTradingOnToggle = page.getByTestId('toggle-oct-checked');
    this.oneClickTermsDialog = page.getByTestId('header-modal').filter({ hasText: 'Terms and Conditions' });
    this.agreeAndContinueButton = this.oneClickTermsDialog.getByRole('button', { name: 'Agree and continue' });
  }

  async open() {
    if (!(await this.logOutOption.isVisible())) {
      await this.gearButton.click();
    }
    await this.logOutOption.waitFor();
  }

  async close() {
    if (await this.logOutOption.isVisible()) {
      await this.gearButton.click();
    }
  }

  async isOneClickTradingOn(): Promise<boolean> {
    await this.open();
    await this.oneClickTradingOnToggle.or(this.oneClickTradingOffToggle).waitFor();
    return this.oneClickTradingOnToggle.isVisible();
  }

  async enableOneClickTrading() {
    if (await this.isOneClickTradingOn()) {
      return;
    }
    await this.oneClickTradingOffToggle.click();
    await this.agreeAndContinueButton.click();
    await this.oneClickTermsDialog.waitFor({ state: 'detached' });
  }

  async disableOneClickTrading() {
    if (!(await this.isOneClickTradingOn())) {
      return;
    }
    await this.oneClickTradingOnToggle.click();
    await this.oneClickTradingOffToggle.waitFor();
  }
}
