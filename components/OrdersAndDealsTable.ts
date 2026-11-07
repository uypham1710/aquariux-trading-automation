import { Page, Locator } from '@playwright/test';
import { parseDisplayNumber, parseOptionalNumber } from '../utils/numbers';

export interface DealRecord {
  dealId: string;
  type: string;
  volume: number;
  profitLoss: number | null;
  comment: string;
}

export interface OrderRecord {
  orderNo: string;
  symbol: string;
  type: string;
  state: string;
  requestedVolume: number;
  filledVolume: number;
  units: number;
  fillPolicy: string;
  entryPrice: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
  profitLoss: number | null;
  openDate: string;
  deals: DealRecord[];
}

export class OrdersAndDealsTable {
  readonly page: Page;
  readonly tab: Locator;
  readonly rows: Locator;
  readonly orderRows: Locator;
  readonly dealRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tab = page.getByTestId('tab-asset-order-type-history-orders-and-deals');
    this.rows = page.getByTestId('asset-history-position-list-item');
    this.orderRows = this.rows.filter({ has: page.getByTestId('asset-history-column-state') });
    this.dealRows = this.rows.filter({ hasNot: page.getByTestId('asset-history-column-state') });
  }

  async open() {
    await this.tab.click();
  }

  orderRow(orderNo: string): Locator {
    return this.orderRows.filter({
      has: this.page.getByTestId('asset-history-column-order-id').filter({ hasText: new RegExp(`^${orderNo}$`) }),
    });
  }

  async waitForOrder(orderNo: string) {
    await this.orderRow(orderNo).waitFor();
  }

  async getOrderNumbers(): Promise<string[]> {
    const texts = await this.orderRows.getByTestId('asset-history-column-order-id').allInnerTexts();
    return texts.map((text) => text.trim());
  }

  async getOrder(orderNo: string): Promise<OrderRecord> {
    const row = this.orderRow(orderNo);
    const cell = async (column: string) => (await row.getByTestId(`asset-history-column-${column}`).innerText()).trim();
    const [requested, filled] = (await cell('volume')).split('/');

    return {
      orderNo,
      symbol: await cell('symbol'),
      type: await cell('order-type'),
      state: await cell('state'),
      requestedVolume: parseDisplayNumber(requested),
      filledVolume: parseDisplayNumber(filled),
      units: parseDisplayNumber(await cell('units')),
      fillPolicy: await cell('fill-policy'),
      entryPrice: parseOptionalNumber(await cell('entry-price')),
      takeProfit: parseOptionalNumber(await cell('take-profit')),
      stopLoss: parseOptionalNumber(await cell('stop-loss')),
      profitLoss: parseOptionalNumber(await cell('profit')),
      openDate: await cell('open-date'),
      deals: await this.readDeals(row),
    };
  }

  private async readDeals(orderRow: Locator): Promise<DealRecord[]> {
    const expandButton = orderRow.getByTestId('asset-history-position-list-item-expand');
    if ((await expandButton.count()) === 0) {
      return [];
    }
    await expandButton.click();
    await this.dealRows.first().waitFor();

    const deals: DealRecord[] = [];
    for (const dealRow of await this.dealRows.all()) {
      const cell = async (column: string) =>
        (await dealRow.getByTestId(`asset-history-column-${column}`).innerText()).trim();
      deals.push({
        dealId: await cell('order-id'),
        type: await cell('order-type'),
        volume: parseDisplayNumber(await cell('volume')),
        profitLoss: parseOptionalNumber(await cell('profit')),
        comment: await cell('comment'),
      });
    }

    await expandButton.click();
    await this.dealRows.first().waitFor({ state: 'detached' });
    return deals;
  }
}
