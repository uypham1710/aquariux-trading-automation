import { Page, Locator } from '@playwright/test';

export class NotificationToast {
  readonly page: Page;
  readonly description: Locator;

  constructor(page: Page) {
    this.page = page;
    this.description = page.getByTestId('notification-box-description');
  }

  message(text: string): Locator {
    return this.description.filter({ hasText: text }).last();
  }

  async waitForMessage(text: string) {
    await this.message(text).waitFor();
  }
}
