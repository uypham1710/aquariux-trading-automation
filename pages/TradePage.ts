import { Page, Locator } from '@playwright/test';
import { Instrument } from '../data/instruments';

// The main trading screen shown after login. Order panel, positions table, etc.
// live in their own component classes; this class only owns page-level elements.
export class TradePage {
  readonly page: Page;
  readonly equity: Locator;
  readonly symbolSearchInput: Locator;
  readonly symbolSearchResults: Locator;
  readonly selectedSymbol: Locator;
  readonly onePointEqualsLabel: Locator;
  // Also owned by PositionsTable; used here only to know when the page has finished loading.
  readonly openPositionsTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.equity = page.getByTestId('account-info-equity-label');
    this.symbolSearchInput = page.getByTestId('symbol-input-search');
    this.symbolSearchResults = page.getByTestId('symbol-input-search-items-symbol');
    this.selectedSymbol = page.getByTestId('symbol-overview-id');
    this.onePointEqualsLabel = page.getByTestId('trade-one-point-equal-label');
    this.openPositionsTab = page.getByTestId('tab-asset-order-type-open-positions');
  }

  // Returns only when Open Positions shows real data. Before the data arrives the table says
  // "Open Positions (0)" and "You have no open positions.", which would make cleanup skip
  // positions that are really open. The counts request tells us the real number to wait for.
  async open() {
    const countsResponse = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/trade/order/v1/counts',
    );
    await this.page.goto('/web/trade');
    const counts = await (await countsResponse).json();
    const openPositionCount: number = counts.result.marketOrderCounts;
    await this.openPositionsTab.filter({ hasText: `Open Positions (${openPositionCount})` }).waitFor();
  }

  async selectSymbol(instrument: Instrument) {
    await this.symbolSearchInput.fill(instrument.symbol);
    await this.symbolSearchResults.filter({ hasText: new RegExp(`^${instrument.symbol}$`) }).click();
    await this.selectedSymbol.filter({ hasText: instrument.symbol }).waitFor();
    // The order panel reloads its settings for the new symbol a moment after the header changes.
    // Typing into it before that finishes gets wiped, so wait for the symbol's point size to show.
    await this.onePointEqualsLabel.filter({ hasText: `One point equals: ${instrument.pointSize}` }).waitFor();
  }
}
