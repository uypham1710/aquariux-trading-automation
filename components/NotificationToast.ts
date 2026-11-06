import { Page, Locator } from '@playwright/test';

// Short-lived message box shown after trading actions. It disappears after a few seconds,
// so wait for it right after the action that triggers it.
export class NotificationToast {
  readonly page: Page;
  readonly description: Locator;

  constructor(page: Page) {
    this.page = page;
    this.description = page.getByTestId('notification-box-description');
  }

  async waitForMessage(text: string) {
    await this.description.filter({ hasText: text }).waitFor();
  }
}
