import { Page, Locator } from '@playwright/test';

export class DeletePendingOrderDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog').filter({ hasText: 'Confirm To Delete Order' });
    this.confirmButton = this.dialog.getByRole('button', { name: 'Confirm' });
  }

  async confirm() {
    await this.confirmButton.click();
  }
}
