import { Page, Locator } from '@playwright/test';
import { Instrument } from '../data/instruments';

export class TradePage {
  readonly page: Page;
  readonly equity: Locator;
  readonly symbolSearchInput: Locator;
  readonly symbolSearchResults: Locator;
  readonly selectedSymbol: Locator;
  readonly onePointEqualsLabel: Locator;
  readonly openPositionsTab: Locator;
  readonly pendingOrdersTab: Locator;
  readonly serverTime: Locator;

  constructor(page: Page) {
    this.page = page;
    this.equity = page.getByTestId('account-info-equity-label');
    this.symbolSearchInput = page.getByTestId('symbol-input-search');
    this.symbolSearchResults = page.getByTestId('symbol-input-search-items-symbol');
    this.selectedSymbol = page.getByTestId('symbol-overview-id');
    this.onePointEqualsLabel = page.getByTestId('trade-one-point-equal-label');
    this.openPositionsTab = page.getByTestId('tab-asset-order-type-open-positions');
    this.pendingOrdersTab = page.getByTestId('tab-asset-order-type-pending-orders');
    this.serverTime = page.getByText(/^Server Time :/);
  }

  async getServerTime(): Promise<string> {
    return (await this.serverTime.innerText()).replace('Server Time :', '').trim();
  }

  async open() {
    await this.page.goto('/web/trade', { waitUntil: 'commit' });
    const countsResponse = await this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/trade/order/v1/counts',
    );
    const counts = await countsResponse.json();
    const openPositionCount: number = counts.result.marketOrderCounts;
    const pendingOrderCount: number = counts.result.pendingOrderCounts;
    await this.openPositionsTab.filter({ hasText: `Open Positions (${openPositionCount})` }).waitFor();
    await this.pendingOrdersTab.filter({ hasText: `Pending Orders (${pendingOrderCount})` }).waitFor();
  }

  async selectSymbol(instrument: Instrument) {
    await this.symbolSearchInput.fill(instrument.symbol);
    await this.symbolSearchResults.filter({ hasText: new RegExp(`^${instrument.symbol}$`) }).click();
    await this.selectedSymbol.filter({ hasText: instrument.symbol }).waitFor();
    await this.onePointEqualsLabel.filter({ hasText: `One point equals: ${instrument.pointSize}` }).waitFor();
  }
}
