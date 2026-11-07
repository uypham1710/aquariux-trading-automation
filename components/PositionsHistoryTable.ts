import { Page, Locator } from '@playwright/test';
import { parseDisplayNumber, parseOptionalNumber } from '../utils/numbers';

export interface ClosedPositionRecord {
  orderNo: string;
  symbol: string;
  type: string;
  closedVolume: number;
  openedVolume: number;
  entryPrice: number;
  closePrice: number;
  profitLoss: number;
  takeProfit: number | null;
  stopLoss: number | null;
  openDate: string;
  closeDate: string;
}

export class PositionsHistoryTable {
  readonly page: Page;
  readonly tab: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tab = page.getByTestId('tab-asset-order-type-history-positions-history');
    this.rows = page.getByTestId('asset-history-position-list-item');
  }

  async open() {
    await this.tab.click();
  }

  closedPositionRows(orderNo: string): Locator {
    return this.rows.filter({
      has: this.page.getByTestId('asset-history-column-order-id').filter({ hasText: new RegExp(`^${orderNo}$`) }),
    });
  }

  async getClosedPositions(orderNo: string): Promise<ClosedPositionRecord[]> {
    await this.closedPositionRows(orderNo).first().waitFor();

    const records: ClosedPositionRecord[] = [];
    for (const row of await this.closedPositionRows(orderNo).all()) {
      const cell = async (column: string) => (await row.getByTestId(`asset-history-column-${column}`).innerText()).trim();
      const [closed, opened = closed] = (await cell('volume')).split('/');
      records.push({
        orderNo,
        symbol: await cell('symbol'),
        type: await cell('order-type'),
        closedVolume: parseDisplayNumber(closed),
        openedVolume: parseDisplayNumber(opened),
        entryPrice: parseDisplayNumber(await cell('entry-price')),
        closePrice: parseDisplayNumber(await cell('close-price')),
        profitLoss: parseDisplayNumber(await cell('profit')),
        takeProfit: parseOptionalNumber(await cell('take-profit')),
        stopLoss: parseOptionalNumber(await cell('stop-loss')),
        openDate: await cell('open-date'),
        closeDate: await cell('close-date'),
      });
    }
    return records;
  }
}
