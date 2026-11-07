import { Page, Locator } from '@playwright/test';
import { parseDisplayNumber } from '../utils/numbers';
import { ExpiryOption } from '../data/orders';

export type Side = 'Buy' | 'Sell';
export type OrderType = 'Market' | 'Limit' | 'Stop' | 'Stop Limit';

export interface PendingOrder {
  side: Side;
  type: Exclude<OrderType, 'Market'>;
  volume: number;
  price: number;
  stopLimitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  expiry?: ExpiryOption;
  expiryHour?: number;
}

export interface MarketOrder {
  side: Side;
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
  stopLossPoints?: number;
  takeProfitPoints?: number;
}

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
  readonly orderTypeDropdown: Locator;
  readonly pendingPriceInput: Locator;
  readonly stopLimitPriceInput: Locator;
  readonly expiryDropdown: Locator;
  readonly expiryTimeField: Locator;
  readonly expiryHourColumn: Locator;
  readonly expiryTimeOkButton: Locator;

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
    this.confirmOrderButton = page.getByTestId('trade-confirmation-button-confirm');
    this.cancelOrderButton = page.getByTestId('trade-confirmation-button-close');
    this.orderTypeDropdown = page.getByTestId('trade-dropdown-order-type');
    this.pendingPriceInput = page.locator('input[name="price"]');
    this.stopLimitPriceInput = page.locator('input[name="priceTrigger"]');
    this.expiryDropdown = page.getByTestId('trade-dropdown-expiry');
    this.expiryTimeField = page.getByTestId('trade-input-expiry-time');
    this.expiryHourColumn = page.getByText('Hour', { exact: true }).locator('..');
    this.expiryTimeOkButton = page.getByRole('button', { name: 'OK', exact: true });
  }

  async setExpiryHour(hour: number) {
    await this.expiryTimeField.click();
    await this.expiryHourColumn.locator('[tabindex="0"]').click();
    await this.expiryHourColumn.getByText(String(hour).padStart(2, '0'), { exact: true }).click();
    await this.expiryTimeOkButton.click();
  }

  private async chooseFromDropdown(dropdown: Locator, option: string) {
    await dropdown.click();
    await dropdown.getByText(option, { exact: true }).last().click();
  }

  async selectOrderType(orderType: OrderType) {
    await this.chooseFromDropdown(this.orderTypeDropdown, orderType);
  }

  async selectExpiry(expiry: ExpiryOption) {
    await this.chooseFromDropdown(this.expiryDropdown, expiry);
  }

  async fillPendingOrder(order: PendingOrder) {
    await this.selectSide(order.side);
    await this.selectOrderType(order.type);
    await this.setVolume(order.volume);
    await this.pendingPriceInput.fill(String(order.price));
    if (order.stopLimitPrice !== undefined) {
      await this.stopLimitPriceInput.fill(String(order.stopLimitPrice));
    }
    if (order.stopLoss !== undefined) {
      await this.setStopLoss(order.stopLoss);
    }
    if (order.takeProfit !== undefined) {
      await this.setTakeProfit(order.takeProfit);
    }
    if (order.expiry !== undefined) {
      await this.selectExpiry(order.expiry);
    }
    if (order.expiryHour !== undefined) {
      await this.setExpiryHour(order.expiryHour);
    }
  }

  async placePendingOrder(order: PendingOrder) {
    await this.fillPendingOrder(order);
    await this.clickPlaceOrder();
    await this.confirmOrder();
  }

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

  async isMarketClosed(): Promise<boolean> {
    const text = await this.placeOrderButton.innerText();
    return text.trim().toLowerCase() === 'market closed';
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
