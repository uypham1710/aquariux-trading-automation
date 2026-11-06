import { Page, Locator } from '@playwright/test';
import { parseDisplayNumber } from '../utils/numbers';

export type Side = 'Buy' | 'Sell';

export interface MarketOrder {
  side: Side;
  volume: number;
  // Give SL/TP either as a price or as points from the market price, not both.
  stopLoss?: number;
  takeProfit?: number;
  stopLossPoints?: number;
  takeProfitPoints?: number;
}

// The "Trade" panel on the right of the trade page, plus the confirmation dialog it opens.
export class OrderPanel {
  readonly page: Page;
  readonly buyButton: Locator;
  readonly sellButton: Locator;
  readonly askPrice: Locator;
  readonly bidPrice: Locator;
  readonly volumeInput: Locator;
  readonly stopLossPriceInput: Locator;
  readonly stopLossPointsInput: Locator;
  readonly takeProfitPriceInput: Locator;
  readonly takeProfitPointsInput: Locator;
  readonly placeOrderButton: Locator;
  readonly confirmOrderButton: Locator;
  readonly cancelOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buyButton = page.getByTestId('trade-button-order-buy');
    this.sellButton = page.getByTestId('trade-button-order-sell');
    this.askPrice = page.getByTestId('trade-live-buy-price');
    this.bidPrice = page.getByTestId('trade-live-sell-price');
    this.volumeInput = page.getByTestId('trade-input-volume');
    this.stopLossPriceInput = page.getByTestId('trade-input-stoploss-price');
    this.stopLossPointsInput = page.getByTestId('trade-input-stoploss-points');
    this.takeProfitPriceInput = page.getByTestId('trade-input-takeprofit-price');
    this.takeProfitPointsInput = page.getByTestId('trade-input-takeprofit-points');
    this.placeOrderButton = page.getByTestId('trade-button-order');
    // Shown when One Click Trading is OFF.
    this.confirmOrderButton = page.getByTestId('trade-confirmation-button-confirm');
    this.cancelOrderButton = page.getByTestId('trade-confirmation-button-close');
  }

  // Validation messages under the inputs have no test id, so they are found by text.
  validationMessage(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  async selectSide(side: Side) {
    await (side === 'Buy' ? this.buyButton : this.sellButton).click();
  }

  async getAskPrice(): Promise<number> {
    return parseDisplayNumber(await this.askPrice.innerText());
  }

  async getBidPrice(): Promise<number> {
    return parseDisplayNumber(await this.bidPrice.innerText());
  }

  async setVolume(volume: number) {
    await this.volumeInput.fill(String(volume));
  }

  async setStopLoss(price: number) {
    await this.stopLossPriceInput.fill(String(price));
  }

  async setTakeProfit(price: number) {
    await this.takeProfitPriceInput.fill(String(price));
  }

  async setStopLossPoints(points: number) {
    await this.stopLossPointsInput.fill(String(points));
  }

  async setTakeProfitPoints(points: number) {
    await this.takeProfitPointsInput.fill(String(points));
  }

  // Order Type defaults to Market after the page loads; selecting other types comes with pending orders.
  async fillMarketOrder(order: MarketOrder) {
    await this.selectSide(order.side);
    await this.setVolume(order.volume);
    if (order.stopLoss !== undefined) {
      await this.setStopLoss(order.stopLoss);
    }
    if (order.takeProfit !== undefined) {
      await this.setTakeProfit(order.takeProfit);
    }
    if (order.stopLossPoints !== undefined) {
      await this.setStopLossPoints(order.stopLossPoints);
    }
    if (order.takeProfitPoints !== undefined) {
      await this.setTakeProfitPoints(order.takeProfitPoints);
    }
  }

  async clickPlaceOrder() {
    await this.placeOrderButton.click();
  }

  async confirmOrder() {
    await this.confirmOrderButton.click();
  }

  async placeMarketOrder(order: MarketOrder) {
    await this.fillMarketOrder(order);
    await this.clickPlaceOrder();
    await this.confirmOrder();
  }
}
