import { Page, Locator } from '@playwright/test';

export type BulkCloseOption = 'Close All' | 'Buy' | 'Sell';
export type BulkDeleteOption = 'Delete All';

export class BulkActionsMenu {
  readonly page: Page;
  readonly bulkCloseButton: Locator;
  readonly bulkDeleteButton: Locator;
  readonly confirmDialog: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bulkCloseButton = page.getByTestId('bulk-close');
    this.bulkDeleteButton = page.getByTestId('bulk-delete');
    this.confirmDialog = page.getByRole('dialog');
    this.confirmButton = this.confirmDialog.getByRole('button', { name: 'Confirm' });
    this.cancelButton = this.confirmDialog.getByRole('button', { name: 'Cancel' });
  }

  async chooseBulkClose(option: BulkCloseOption) {
    await this.bulkCloseButton.click();
    await this.bulkCloseButton.getByText(option, { exact: true }).click();
  }

  async chooseBulkDelete(option: BulkDeleteOption) {
    await this.bulkDeleteButton.click();
    await this.bulkDeleteButton.getByText(option, { exact: true }).click();
  }

  async confirm() {
    await this.confirmButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
