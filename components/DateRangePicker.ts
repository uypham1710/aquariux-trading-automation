import { Page, Locator } from '@playwright/test';

export type DateRangePreset = 'Last 7 days' | 'Last 30 days' | 'Last 90 days' | 'This year' | 'Last year';

export class DateRangePicker {
  readonly page: Page;
  readonly rangeButton: Locator;
  readonly dropdown: Locator;
  readonly applyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rangeButton = page.getByRole('button').filter({ has: page.getByTestId('orders-date-picker-icon-calendar') });
    this.dropdown = page.getByTestId('orders-date-picker-dropdown');
    this.applyButton = page.getByTestId('orders-date-picker-button-apply');
  }

  async selectPreset(preset: DateRangePreset) {
    await this.rangeButton.click();
    await this.dropdown.getByText(preset, { exact: true }).click();
    await this.applyButton.click();
  }

  async getRange(): Promise<{ from: string; to: string }> {
    const [from, to] = (await this.rangeButton.innerText()).split('-').map((part) => part.trim());
    return { from, to };
  }
}
