import { test, expect } from '../fixtures/trading';
import { XAUUSD } from '../data/instruments';
import { SL_TP_DISTANCE_POINTS } from '../data/orders';
import { priceAbove, priceBelow } from '../utils/prices';

const instrument = XAUUSD;

test.describe('Scope 2 - Market orders with One Click Trading', () => {
  test.beforeEach(async ({ tradePage, positionsTable }) => {
    await tradePage.selectSymbol(instrument);
    await positionsTable.open();
  });

  test('TC-2.05 should ask for confirmation when One Click Trading is OFF @regression', async ({ orderPanel }) => {
    await orderPanel.fillMarketOrder({ side: 'Buy', volume: instrument.minVolume });
    await orderPanel.clickPlaceOrder();

    await expect(orderPanel.confirmOrderButton).toBeVisible();
    await orderPanel.cancelOrderButton.click();
  });

  test.describe('with One Click Trading ON', () => {

    test('TC-2.01 should enable and disable One Click Trading from Settings @regression', async ({
      settingsMenu,
      oneClickTrading,
    }) => {
      await settingsMenu.open();
      expect(await settingsMenu.isOneClickTradingOn()).toBe(true);

      await settingsMenu.disableOneClickTrading();
      expect(await settingsMenu.isOneClickTradingOn()).toBe(false);
    });

    test('TC-2.02 should place Buy market order without confirmation when One Click Trading is ON @smoke @regression', async ({
      positionsTable,
      openPosition,
      oneClickTrading,
    }) => {
      const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume }, { oneClickTrading: true });

      expect((await positionsTable.getPosition(orderNo)).type).toBe('BUY');
    });

    test('TC-2.03 should place Sell market order without confirmation when One Click Trading is ON @regression', async ({
      positionsTable,
      openPosition,
      oneClickTrading,
    }) => {
      const orderNo = await openPosition({ side: 'Sell', volume: instrument.minVolume }, { oneClickTrading: true });

      expect((await positionsTable.getPosition(orderNo)).type).toBe('SELL');
    });

    test('TC-2.04 should place market order with SL and TP when One Click Trading is ON @regression', async ({
      orderPanel,
      positionsTable,
      openPosition,
      oneClickTrading,
    }) => {
      const ask = await orderPanel.getAskPrice();
      const stopLoss = priceBelow(ask, SL_TP_DISTANCE_POINTS, instrument);
      const takeProfit = priceAbove(ask, SL_TP_DISTANCE_POINTS, instrument);

      const orderNo = await openPosition(
        { side: 'Buy', volume: instrument.minVolume, stopLoss, takeProfit },
        { oneClickTrading: true },
      );

      const position = await positionsTable.getPosition(orderNo);
      expect(position.stopLoss).toBe(stopLoss);
      expect(position.takeProfit).toBe(takeProfit);
    });
  });
});
