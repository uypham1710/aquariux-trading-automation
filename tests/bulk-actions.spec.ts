import { test, expect } from '../fixtures/trading';
import { XAUUSD } from '../data/instruments';
import { PENDING_DISTANCE_PERCENT } from '../data/orders';
import { percentBelow } from '../utils/prices';

const instrument = XAUUSD;

const OTHER_POSITIONS_REASON = 'Account holds open positions not created by this test; Bulk Close would close them too';
const OTHER_PENDING_REASON = 'Account holds pending orders not created by this test; Bulk Delete would delete them too';

test.describe('Scope 5 - Bulk close and bulk delete', () => {
  test.beforeEach(async ({ tradePage, orderPanel }) => {
    await tradePage.selectSymbol(instrument);
    test.skip(await orderPanel.isMarketClosed(), `Market is closed for ${instrument.symbol}; orders cannot be placed`);
  });

  test.describe('Bulk Close', () => {
    test.beforeEach(async ({ positionsTable }) => {
      await positionsTable.open();
      test.skip((await positionsTable.getOrderNumbers()).length > 0, OTHER_POSITIONS_REASON);
    });

    test('TC-5.01 should close all open positions with Bulk Close "Close All" @regression', async ({
      positionsTable,
      positionsHistoryTable,
      bulkActionsMenu,
      openPosition,
    }) => {
      const buyOrderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });
      const sellOrderNo = await openPosition({ side: 'Sell', volume: instrument.minVolume });

      await bulkActionsMenu.chooseBulkClose('Close All');
      await bulkActionsMenu.confirm();

      await expect(positionsTable.positionRow(buyOrderNo)).toHaveCount(0);
      await expect(positionsTable.positionRow(sellOrderNo)).toHaveCount(0);
      await positionsHistoryTable.open();
      expect(await positionsHistoryTable.getClosedPositions(buyOrderNo)).toHaveLength(1);
      expect(await positionsHistoryTable.getClosedPositions(sellOrderNo)).toHaveLength(1);
    });

    test('TC-5.02 should close only Buy positions with Bulk Close "Buy" @regression', async ({
      positionsTable,
      bulkActionsMenu,
      openPosition,
    }) => {
      const buyOrderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });
      const sellOrderNo = await openPosition({ side: 'Sell', volume: instrument.minVolume });

      await bulkActionsMenu.chooseBulkClose('Buy');
      await bulkActionsMenu.confirm();

      await expect(positionsTable.positionRow(buyOrderNo)).toHaveCount(0);
      await expect(positionsTable.positionRow(sellOrderNo)).toHaveCount(1);
    });

    test('TC-5.03 should close only Sell positions with Bulk Close "Sell" @regression', async ({
      positionsTable,
      bulkActionsMenu,
      openPosition,
    }) => {
      const buyOrderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });
      const sellOrderNo = await openPosition({ side: 'Sell', volume: instrument.minVolume });

      await bulkActionsMenu.chooseBulkClose('Sell');
      await bulkActionsMenu.confirm();

      await expect(positionsTable.positionRow(sellOrderNo)).toHaveCount(0);
      await expect(positionsTable.positionRow(buyOrderNo)).toHaveCount(1);
    });

    test('TC-5.04 should keep all positions when the Bulk Close confirmation is canceled @regression', async ({
      positionsTable,
      bulkActionsMenu,
      openPosition,
    }) => {
      const buyOrderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });
      const sellOrderNo = await openPosition({ side: 'Sell', volume: instrument.minVolume });

      await bulkActionsMenu.chooseBulkClose('Close All');
      await bulkActionsMenu.cancel();

      await expect(bulkActionsMenu.confirmDialog).toBeHidden();
      await expect(positionsTable.positionRow(buyOrderNo)).toHaveCount(1);
      await expect(positionsTable.positionRow(sellOrderNo)).toHaveCount(1);
    });
  });

  test.describe('Bulk Delete', () => {
    test.beforeEach(async ({ pendingOrdersTable }) => {
      await pendingOrdersTable.open();
      test.skip((await pendingOrdersTable.getOrderNumbers()).length > 0, OTHER_PENDING_REASON);
    });

    test('TC-5.05 should delete all pending orders with bulk delete @regression', async ({
      orderPanel,
      pendingOrdersTable,
      ordersAndDealsTable,
      bulkActionsMenu,
      placePendingOrder,
    }) => {
      const ask = await orderPanel.getAskPrice();
      const limitOrderNo = await placePendingOrder({
        side: 'Buy',
        type: 'Limit',
        volume: instrument.minVolume,
        price: percentBelow(ask, PENDING_DISTANCE_PERCENT, instrument),
      });
      const stopOrderNo = await placePendingOrder({
        side: 'Sell',
        type: 'Stop',
        volume: instrument.minVolume,
        price: percentBelow(ask, PENDING_DISTANCE_PERCENT, instrument),
      });

      await bulkActionsMenu.chooseBulkDelete('Delete All');
      await bulkActionsMenu.confirm();

      await expect(pendingOrdersTable.orderRow(limitOrderNo)).toHaveCount(0);
      await expect(pendingOrdersTable.orderRow(stopOrderNo)).toHaveCount(0);
      await ordersAndDealsTable.open();
      expect((await ordersAndDealsTable.getOrder(limitOrderNo)).state).toBe('CANCELED');
      expect((await ordersAndDealsTable.getOrder(stopOrderNo)).state).toBe('CANCELED');
    });
  });
});
