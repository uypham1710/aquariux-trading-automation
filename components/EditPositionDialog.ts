import { Page, Locator } from '@playwright/test';

// "Edit Position" dialog, opened by the Edit icon in an Open Positions row.
export class EditPositionDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly stopLossInput: Locator;
  readonly takeProfitInput: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmUpdateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId('edit-confirmation-modal');
    // The dialog reuses the order panel's input ids, so they must be scoped to the dialog.
    this.stopLossInput = this.dialog.getByTestId('trade-input-stoploss-price');
    this.takeProfitInput = this.dialog.getByTestId('trade-input-takeprofit-price');
    this.updateButton = this.dialog.getByTestId('edit-button-order');
    this.cancelButton = this.dialog.getByTestId('edit-button-cancel');
    // UPDATE POSITION opens the same "Order Confirmation" dialog as placing an order.
    this.confirmUpdateButton = page.getByTestId('trade-confirmation-button-confirm');
  }

  validationMessage(text: string): Locator {
    return this.dialog.getByText(text, { exact: true });
  }

  async setStopLoss(price: number) {
    await this.stopLossInput.fill(String(price));
  }

  async setTakeProfit(price: number) {
    await this.takeProfitInput.fill(String(price));
  }

  // Separate from confirmUpdate() so negative tests can check validation without confirming.
  async clickUpdate() {
    await this.updateButton.click();
  }

  async confirmUpdate() {
    await this.confirmUpdateButton.click();
  }

  async updateStopLossAndTakeProfit(stopLoss: number, takeProfit: number) {
    await this.setStopLoss(stopLoss);
    await this.setTakeProfit(takeProfit);
    await this.clickUpdate();
    await this.confirmUpdate();
  }
}
