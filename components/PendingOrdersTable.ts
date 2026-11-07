import { Page, Locator } from '@playwright/test';
import { parseDisplayNumber, parseOptionalNumber } from '../utils/numbers';

export interface PendingOrderRecord {
  orderNo: string;
  symbol: string;
  type: string;
  requestedVolume: number;
  filledVolume: number;
  fillPolicy: string;
  expiry: string;
  expiryDate: string;
  price: number;
  takeProfit: number | null;
  stopLoss: number | null;
}

export class PendingOrdersTable {
  readonly page: Page;
  readonly tab: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tab = page.getByTestId('tab-asset-order-type-pending-orders');
    this.rows = page.getByTestId('asset-pending-list-item');
  }

  async open() {
    await this.tab.click();
    await this.waitForRowsToRender();
  }

  async waitForRowsToRender() {
    const label = await this.tab.innerText();
    const count = Number(label.match(/\((\d+)\)/)?.[1] ?? 0);
    if (count > 0) {
      await this.rows.nth(count - 1).waitFor();
    }
  }

  orderRow(orderNo: string): Locator {
    return this.rows.filter({
      has: this.page.getByTestId('asset-pending-column-order-id').filter({ hasText: new RegExp(`^${orderNo}$`) }),
    });
  }

  async getOrderNumbers(): Promise<string[]> {
    const texts = await this.rows.getByTestId('asset-pending-column-order-id').allInnerTexts();
    return texts.map((text) => text.trim());
  }

  async getPendingOrder(orderNo: string): Promise<PendingOrderRecord> {
    const row = this.orderRow(orderNo);
    const cell = async (column: string) => (await row.getByTestId(`asset-pending-column-${column}`).innerText()).trim();
    const [requested, filled] = (await cell('volume')).split('/');
    return {
      orderNo,
      symbol: await cell('symbol'),
      type: await cell('order-type'),
      requestedVolume: parseDisplayNumber(requested),
      filledVolume: parseDisplayNumber(filled),
      fillPolicy: await cell('fill-policy'),
      expiry: await cell('expiry'),
      expiryDate: await cell('expiry-date'),
      price: parseDisplayNumber(await cell('entry-price')),
      takeProfit: parseOptionalNumber(await cell('take-profit')),
      stopLoss: parseOptionalNumber(await cell('stop-loss')),
    };
  }

  async isOrderPending(orderNo: string): Promise<boolean> {
    return (await this.orderRow(orderNo).count()) > 0;
  }

  async clickEdit(orderNo: string) {
    await this.orderRow(orderNo).getByTestId('asset-open-button-edit').click();
  }

  async clickDelete(orderNo: string) {
    await this.orderRow(orderNo).getByTestId('asset-open-button-close').click();
  }

  async waitForOrderRemoved(orderNo: string) {
    await this.orderRow(orderNo).waitFor({ state: 'detached' });
  }
}
