import { Page, Locator } from '@playwright/test';

export class NotificationBell {
  readonly page: Page;
  readonly bellButton: Locator;
  readonly positionsTab: Locator;
  readonly items: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bellButton = page.getByTestId('notification-selector');
    this.positionsTab = page.getByTestId('tab-notification-type-order');
    this.items = page.getByTestId('notification-list-result-item');
  }

  async openPositionNotifications() {
    await this.bellButton.click();
    await this.positionsTab.click();
  }

  notification(orderNo: string, title: string): Locator {
    return this.items
      .filter({ has: this.page.getByTestId('notification-list-result-item-title').filter({ hasText: new RegExp(`^${title}$`) }) })
      .filter({ has: this.page.getByTestId('notification-list-result-item-meta').filter({ hasText: new RegExp(`Order No\\. ${orderNo}$`) }) });
  }
}
