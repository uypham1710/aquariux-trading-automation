import { Page, Locator } from '@playwright/test';
import { parseDisplayNumber, parseOptionalNumber } from '../utils/numbers';

export interface PositionRecord {
  orderNo: string;
  symbol: string;
  type: string;
  volume: number;
  units: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  openDate: string;
}

export class PositionsTable {
  readonly page: Page;
  readonly tab: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tab = page.getByTestId('tab-asset-order-type-open-positions');
    this.rows = page.getByTestId('asset-open-list-item');
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

  positionRow(orderNo: string): Locator {
    return this.rows.filter({
      has: this.page.getByTestId('asset-open-column-order-id').filter({ hasText: new RegExp(`^${orderNo}$`) }),
    });
  }

  async getOrderNumbers(): Promise<string[]> {
    const texts = await this.rows.getByTestId('asset-open-column-order-id').allInnerTexts();
    return texts.map((text) => text.trim());
  }

  async getPosition(orderNo: string): Promise<PositionRecord> {
    const row = this.positionRow(orderNo);
    const cell = async (column: string) => (await row.getByTestId(`asset-open-column-${column}`).innerText()).trim();
    return {
      orderNo,
      symbol: await cell('symbol'),
      type: await cell('order-type'),
      volume: parseDisplayNumber(await cell('volume')),
      units: parseDisplayNumber(await cell('units')),
      entryPrice: parseDisplayNumber(await cell('entry-price')),
      currentPrice: parseDisplayNumber(await cell('current-price')),
      stopLoss: parseOptionalNumber(await cell('stop-loss')),
      takeProfit: parseOptionalNumber(await cell('take-profit')),
      openDate: await cell('open-date'),
    };
  }

  async isPositionOpen(orderNo: string): Promise<boolean> {
    return (await this.positionRow(orderNo).count()) > 0;
  }

  async clickEdit(orderNo: string) {
    await this.positionRow(orderNo).getByTestId('asset-open-button-edit').click();
  }

  async clickClose(orderNo: string) {
    await this.positionRow(orderNo).getByTestId('asset-open-button-close').click();
  }

  async waitForPositionClosed(orderNo: string) {
    await this.positionRow(orderNo).waitFor({ state: 'detached' });
  }
}
