import { Page, Locator } from '@playwright/test';

export class EditPendingOrderDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly priceInput: Locator;
  readonly stopLossInput: Locator;
  readonly takeProfitInput: Locator;
  readonly confirmButton: Locator;
  readonly confirmUpdateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog').filter({ has: page.getByTestId('edit-button-order') });
    this.priceInput = this.dialog.locator('input[name="price"]');
    this.stopLossInput = this.dialog.getByTestId('trade-input-stoploss-price');
    this.takeProfitInput = this.dialog.getByTestId('trade-input-takeprofit-price');
    this.confirmButton = this.dialog.getByTestId('edit-button-order');
    this.confirmUpdateButton = page.getByTestId('trade-confirmation-button-confirm');
  }

  async setPrice(price: number) {
    await this.priceInput.fill(String(price));
  }

  async setStopLoss(price: number) {
    await this.stopLossInput.fill(String(price));
  }

  async setTakeProfit(price: number) {
    await this.takeProfitInput.fill(String(price));
  }

  async save() {
    await this.confirmButton.click();
    await this.confirmUpdateButton.click();
  }
}
