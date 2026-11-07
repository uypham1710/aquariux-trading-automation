import { Page, Locator } from '@playwright/test';

export class ClosePositionDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly volumeInput: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('trade-market-order-modal');
    this.volumeInput = this.dialog.getByRole('textbox');
    this.confirmButton = this.dialog.getByRole('button', { name: 'Confirm' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async closeVolume(volume: number) {
    await this.volumeInput.fill(String(volume));
    await this.confirmButton.click();
  }
}
