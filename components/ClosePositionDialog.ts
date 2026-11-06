import { Page, Locator } from '@playwright/test';

// "Confirm To Close Position" dialog, opened by the Close icon in an Open Positions row.
// The volume field makes it the place for both full and partial close.
export class ClosePositionDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly volumeInput: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('trade-market-order-modal');
    // The only text box in the dialog; it has no test id or label.
    this.volumeInput = this.dialog.getByRole('textbox');
    this.confirmButton = this.dialog.getByRole('button', { name: 'Confirm' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  // CONFIRM stays disabled until a volume is entered.
  async closeVolume(volume: number) {
    await this.volumeInput.fill(String(volume));
    await this.confirmButton.click();
  }
}
