import { test, expect } from '../fixtures/trading';
import { XAUUSD } from '../data/instruments';
import { SL_TP_DISTANCE_POINTS, PENDING_DISTANCE_PERCENT } from '../data/orders';
import { TOAST_MESSAGES } from '../data/messages';
import { PositionsTable } from '../components/PositionsTable';
import { ClosePositionDialog } from '../components/ClosePositionDialog';
import { NotificationToast } from '../components/NotificationToast';
import { OrdersAndDealsTable } from '../components/OrdersAndDealsTable';
import { priceAbove, priceBelow, percentBelow } from '../utils/prices';
import { parseServerDateTime } from '../utils/dates';
import { waitForNewOrderNumber } from '../utils/orders';

const instrument = XAUUSD;

async function closePositionAndFindClosingOrder(
  pages: {
    positionsTable: PositionsTable;
    closePositionDialog: ClosePositionDialog;
    notificationToast: NotificationToast;
    ordersAndDealsTable: OrdersAndDealsTable;
  },
  orderNo: string,
  volumeToClose: number,
): Promise<string> {
  const { positionsTable, closePositionDialog, notificationToast, ordersAndDealsTable } = pages;

  await ordersAndDealsTable.open();
  await ordersAndDealsTable.waitForOrder(orderNo);
  const orderNumbersBefore = await ordersAndDealsTable.getOrderNumbers();

  await positionsTable.open();
  await positionsTable.clickClose(orderNo);
  await closePositionDialog.closeVolume(volumeToClose);
  await notificationToast.waitForMessage(TOAST_MESSAGES.positionClosed);

  await ordersAndDealsTable.open();
  return waitForNewOrderNumber(() => ordersAndDealsTable.getOrderNumbers(), orderNumbersBefore, 'Orders & Deals');
}

test.describe('Scope 7 - Order details and status across records', () => {
  test.beforeEach(async ({ tradePage, positionsTable }) => {
    await tradePage.selectSymbol(instrument);
    await positionsTable.open();
  });

  test('TC-7.01 should show the same Buy market order details in toast, Open Positions and Orders & Deals @smoke @regression', async ({
    orderPanel,
    positionsTable,
    ordersAndDealsTable,
    openPosition,
  }) => {
    const ask = await orderPanel.getAskPrice();
    const stopLoss = priceBelow(ask, SL_TP_DISTANCE_POINTS, instrument);
    const takeProfit = priceAbove(ask, SL_TP_DISTANCE_POINTS, instrument);

    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume, stopLoss, takeProfit });
    const position = await positionsTable.getPosition(orderNo);

    await ordersAndDealsTable.open();
    const order = await ordersAndDealsTable.getOrder(orderNo);

    expect(order.symbol).toBe(position.symbol);
    expect(order.type).toBe('Buy');
    expect(order.state).toBe('FILLED');
    expect(order.requestedVolume).toBe(instrument.minVolume);
    expect(order.filledVolume).toBe(instrument.minVolume);
    expect(order.units).toBe(position.units);
    expect(order.fillPolicy).toBe('Fill or Kill');
    expect(order.entryPrice).toBe(position.entryPrice);
    expect(order.stopLoss).toBe(position.stopLoss);
    expect(order.takeProfit).toBe(position.takeProfit);
    expect(order.openDate).toBe(position.openDate);

    expect(order.deals).toHaveLength(1);
    const [openingDeal] = order.deals;
    expect(openingDeal.type).toBe('In');
    expect(openingDeal.volume).toBe(instrument.minVolume);
    expect(openingDeal.dealId).not.toBe(orderNo);
  });

  test('TC-7.02 should record a closing Sell order and Out deal when a Buy position is closed @regression', async ({
    positionsTable,
    closePositionDialog,
    notificationToast,
    ordersAndDealsTable,
    positionsHistoryTable,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });
    const position = await positionsTable.getPosition(orderNo);

    const closingOrderNo = await closePositionAndFindClosingOrder(
      { positionsTable, closePositionDialog, notificationToast, ordersAndDealsTable },
      orderNo,
      instrument.minVolume,
    );
    const closingOrder = await ordersAndDealsTable.getOrder(closingOrderNo);

    expect(closingOrderNo).not.toBe(orderNo);
    expect(closingOrder.type).toBe('Sell');
    expect(closingOrder.state).toBe('FILLED');
    expect(closingOrder.filledVolume).toBe(instrument.minVolume);
    expect(closingOrder.profitLoss).toBeNull();
    expect(closingOrder.deals).toHaveLength(1);
    const [closingDeal] = closingOrder.deals;
    expect(closingDeal.type).toBe('Out');
    expect(closingDeal.profitLoss).not.toBeNull();

    await positionsHistoryTable.open();
    const closedPositions = await positionsHistoryTable.getClosedPositions(orderNo);
    expect(closedPositions).toHaveLength(1);
    expect(closedPositions[0].type).toBe('BUY');
    expect(closedPositions[0].closedVolume).toBe(instrument.minVolume);
    expect(closedPositions[0].openedVolume).toBe(instrument.minVolume);
    expect(closedPositions[0].entryPrice).toBe(position.entryPrice);
    expect(closedPositions[0].profitLoss).toBe(closingDeal.profitLoss);
  });

  test('TC-7.03 should record a canceled pending order with no deals @regression', async ({
    orderPanel,
    pendingOrdersTable,
    deletePendingOrderDialog,
    notificationToast,
    ordersAndDealsTable,
    placePendingOrder,
  }) => {
    const price = percentBelow(await orderPanel.getAskPrice(), PENDING_DISTANCE_PERCENT, instrument);
    const orderNo = await placePendingOrder({ side: 'Buy', type: 'Limit', volume: instrument.minVolume, price });

    await pendingOrdersTable.clickDelete(orderNo);
    await deletePendingOrderDialog.confirm();
    await notificationToast.waitForMessage(TOAST_MESSAGES.orderDeleted);

    await ordersAndDealsTable.open();
    const order = await ordersAndDealsTable.getOrder(orderNo);
    expect(order.type).toBe('Buy Limit');
    expect(order.state).toBe('CANCELED');
    expect(order.requestedVolume).toBe(instrument.minVolume);
    expect(order.filledVolume).toBe(0);
    expect(order.fillPolicy).toBe('Return');
    expect(order.entryPrice).toBe(price);
    expect(order.deals).toEqual([]);
  });

  test('TC-7.04 should show the same Sell market order details across records @regression', async ({
    positionsTable,
    closePositionDialog,
    notificationToast,
    ordersAndDealsTable,
    positionsHistoryTable,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Sell', volume: instrument.minVolume });
    const position = await positionsTable.getPosition(orderNo);

    await ordersAndDealsTable.open();
    const openingOrder = await ordersAndDealsTable.getOrder(orderNo);
    expect(openingOrder.type).toBe('Sell');
    expect(openingOrder.state).toBe('FILLED');
    expect(openingOrder.entryPrice).toBe(position.entryPrice);
    expect(openingOrder.deals.map((deal) => deal.type)).toEqual(['In']);

    const closingOrderNo = await closePositionAndFindClosingOrder(
      { positionsTable, closePositionDialog, notificationToast, ordersAndDealsTable },
      orderNo,
      instrument.minVolume,
    );
    const closingOrder = await ordersAndDealsTable.getOrder(closingOrderNo);
    expect(closingOrder.type).toBe('Buy');
    expect(closingOrder.state).toBe('FILLED');
    expect(closingOrder.deals.map((deal) => deal.type)).toEqual(['Out']);

    await positionsHistoryTable.open();
    const [closedPosition] = await positionsHistoryTable.getClosedPositions(orderNo);
    expect(closedPosition.type).toBe('SELL');
    expect(closedPosition.profitLoss).toBe(closingOrder.deals[0].profitLoss);
  });

  test('TC-7.05 should timestamp records close to Server Time @regression', async ({
    tradePage,
    positionsTable,
    ordersAndDealsTable,
    openPosition,
  }) => {
    const serverTimeBefore = parseServerDateTime(await tradePage.getServerTime());
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });
    const serverTimeAfter = parseServerDateTime(await tradePage.getServerTime());

    const position = await positionsTable.getPosition(orderNo);
    expect(position.openDate).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    const openTime = parseServerDateTime(position.openDate);
    expect(openTime).toBeGreaterThanOrEqual(serverTimeBefore - 1000);
    expect(openTime).toBeLessThanOrEqual(serverTimeAfter + 1000);

    await ordersAndDealsTable.open();
    const order = await ordersAndDealsTable.getOrder(orderNo);
    expect(order.openDate).toBe(position.openDate);
  });

  test('TC-7.06 should record a partial close consistently across records @regression', async ({
    positionsTable,
    closePositionDialog,
    notificationToast,
    ordersAndDealsTable,
    positionsHistoryTable,
    openPosition,
  }) => {
    const openVolume = instrument.minVolume * 2;
    const orderNo = await openPosition({ side: 'Buy', volume: openVolume });

    const closingOrderNo = await closePositionAndFindClosingOrder(
      { positionsTable, closePositionDialog, notificationToast, ordersAndDealsTable },
      orderNo,
      instrument.minVolume,
    );
    const closingOrder = await ordersAndDealsTable.getOrder(closingOrderNo);
    expect(closingOrder.type).toBe('Sell');
    expect(closingOrder.filledVolume).toBe(instrument.minVolume);
    expect(closingOrder.deals.map((deal) => deal.type)).toEqual(['Out']);
    expect(closingOrder.deals[0].volume).toBe(instrument.minVolume);

    await positionsTable.open();
    expect((await positionsTable.getPosition(orderNo)).volume).toBe(openVolume - instrument.minVolume);

    await positionsHistoryTable.open();
    const closedParts = await positionsHistoryTable.getClosedPositions(orderNo);
    expect(closedParts).toHaveLength(1);
    expect(closedParts[0].closedVolume).toBe(instrument.minVolume);
    expect(closedParts[0].openedVolume).toBe(openVolume);
    expect(closedParts[0].profitLoss).toBe(closingOrder.deals[0].profitLoss);
  });
});
