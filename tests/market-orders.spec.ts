import { test, expect } from '../fixtures/trading';
import { XAUUSD } from '../data/instruments';
import { SL_TP_DISTANCE_POINTS, BELOW_MIN_VOLUME } from '../data/orders';
import { SL_TP_MESSAGES, minimumVolumeMessage } from '../data/messages';
import { priceAbove, priceBelow } from '../utils/prices';

const instrument = XAUUSD;

test.describe('Scope 1 - Market orders with Stop Loss and Take Profit', () => {
  test.beforeEach(async ({ tradePage, positionsTable }) => {
    await tradePage.selectSymbol(instrument);
    await positionsTable.open();
  });

  test('TC-1.01 should place Buy market order with valid SL and TP @smoke @regression', async ({
    orderPanel,
    positionsTable,
    openPosition,
  }) => {
    const ask = await orderPanel.getAskPrice();
    const stopLoss = priceBelow(ask, SL_TP_DISTANCE_POINTS, instrument);
    const takeProfit = priceAbove(ask, SL_TP_DISTANCE_POINTS, instrument);

    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume, stopLoss, takeProfit });

    const position = await positionsTable.getPosition(orderNo);
    expect(position.type).toBe('BUY');
    expect(position.volume).toBe(instrument.minVolume);
    expect(position.entryPrice).toBeWithinTolerance(ask, instrument.priceTolerance);
    expect(position.stopLoss).toBe(stopLoss);
    expect(position.takeProfit).toBe(takeProfit);
  });

  test('TC-1.02 should place Sell market order with valid SL and TP @smoke @regression', async ({
    orderPanel,
    positionsTable,
    openPosition,
  }) => {
    const bid = await orderPanel.getBidPrice();
    const stopLoss = priceAbove(bid, SL_TP_DISTANCE_POINTS, instrument);
    const takeProfit = priceBelow(bid, SL_TP_DISTANCE_POINTS, instrument);

    const orderNo = await openPosition({ side: 'Sell', volume: instrument.minVolume, stopLoss, takeProfit });

    const position = await positionsTable.getPosition(orderNo);
    expect(position.type).toBe('SELL');
    expect(position.volume).toBe(instrument.minVolume);
    expect(position.entryPrice).toBeWithinTolerance(bid, instrument.priceTolerance);
    expect(position.stopLoss).toBe(stopLoss);
    expect(position.takeProfit).toBe(takeProfit);
  });

  test('TC-1.03 should place Buy market order without SL and TP @regression', async ({
    positionsTable,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });

    const position = await positionsTable.getPosition(orderNo);
    expect(position.stopLoss).toBeNull();
    expect(position.takeProfit).toBeNull();
  });

  test('TC-1.04 should place Buy market order with SL and TP entered in Points @regression', async ({
    positionsTable,
    openPosition,
  }) => {
    const orderNo = await openPosition({
      side: 'Buy',
      volume: instrument.minVolume,
      stopLossPoints: SL_TP_DISTANCE_POINTS,
      takeProfitPoints: SL_TP_DISTANCE_POINTS,
    });

    const position = await positionsTable.getPosition(orderNo);
    // The app converts points using the live price at the moment of typing, which differs from
    // the entry price by the spread and any price movement, so allow the entry tolerance.
    expect(position.stopLoss).toBeWithinTolerance(
      priceBelow(position.entryPrice, SL_TP_DISTANCE_POINTS, instrument),
      instrument.priceTolerance,
    );
    expect(position.takeProfit).toBeWithinTolerance(
      priceAbove(position.entryPrice, SL_TP_DISTANCE_POINTS, instrument),
      instrument.priceTolerance,
    );
  });

  test.describe('SL/TP and volume validation', () => {
    // The app does not disable PLACE ORDER for invalid values. Clicking it shows a message
    // under the input and the confirmation dialog never opens, so no order is sent.

    test('TC-1.05 should not place Buy market order when SL is above the Sell price @regression', async ({
      orderPanel,
    }) => {
      const bid = await orderPanel.getBidPrice();

      await orderPanel.fillMarketOrder({
        side: 'Buy',
        volume: instrument.minVolume,
        stopLoss: priceAbove(bid, SL_TP_DISTANCE_POINTS, instrument),
      });
      await orderPanel.clickPlaceOrder();

      await expect(orderPanel.validationMessage(SL_TP_MESSAGES.buyStopLossTooHigh)).toBeVisible();
      await expect(orderPanel.confirmOrderButton).toBeHidden();
    });

    test('TC-1.06 should not place Buy market order when TP is below the Sell price @regression', async ({
      orderPanel,
    }) => {
      const bid = await orderPanel.getBidPrice();

      await orderPanel.fillMarketOrder({
        side: 'Buy',
        volume: instrument.minVolume,
        takeProfit: priceBelow(bid, SL_TP_DISTANCE_POINTS, instrument),
      });
      await orderPanel.clickPlaceOrder();

      await expect(orderPanel.validationMessage(SL_TP_MESSAGES.buyTakeProfitTooLow)).toBeVisible();
      await expect(orderPanel.confirmOrderButton).toBeHidden();
    });

    test('TC-1.07 should not place Sell market order when SL is below the Buy price @regression', async ({
      orderPanel,
    }) => {
      const ask = await orderPanel.getAskPrice();

      await orderPanel.fillMarketOrder({
        side: 'Sell',
        volume: instrument.minVolume,
        stopLoss: priceBelow(ask, SL_TP_DISTANCE_POINTS, instrument),
      });
      await orderPanel.clickPlaceOrder();

      await expect(orderPanel.validationMessage(SL_TP_MESSAGES.sellStopLossTooLow)).toBeVisible();
      await expect(orderPanel.confirmOrderButton).toBeHidden();
    });

    test('TC-1.08 should not place Sell market order when TP is above the Buy price @regression', async ({
      orderPanel,
    }) => {
      const ask = await orderPanel.getAskPrice();

      await orderPanel.fillMarketOrder({
        side: 'Sell',
        volume: instrument.minVolume,
        takeProfit: priceAbove(ask, SL_TP_DISTANCE_POINTS, instrument),
      });
      await orderPanel.clickPlaceOrder();

      await expect(orderPanel.validationMessage(SL_TP_MESSAGES.sellTakeProfitTooHigh)).toBeVisible();
      await expect(orderPanel.confirmOrderButton).toBeHidden();
    });

    test('TC-1.09 should not place market order with volume below the minimum @regression', async ({
      orderPanel,
    }) => {
      await orderPanel.fillMarketOrder({ side: 'Buy', volume: BELOW_MIN_VOLUME });
      await orderPanel.clickPlaceOrder();

      await expect(orderPanel.validationMessage(minimumVolumeMessage(instrument.minVolume))).toBeVisible();
      await expect(orderPanel.confirmOrderButton).toBeHidden();
    });
  });
});
