import { test, expect } from '../fixtures/trading';
import { XAUUSD } from '../data/instruments';
import { TOAST_MESSAGES, NOTIFICATION_TITLES } from '../data/messages';
import { waitForNewOrderNumber } from '../utils/orders';

const instrument = XAUUSD;

function toDayMonthYear(serverTime: string): string {
  const [year, month, day] = serverTime.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

test.describe('Scope 6 - Transactions, notifications, order history', () => {
  test.beforeEach(async ({ tradePage, positionsTable }) => {
    await tradePage.selectSymbol(instrument);
    await positionsTable.open();
  });

  test('TC-6.01 should show a toast after placing a market order @regression', async ({
    orderPanel,
    positionsTable,
    notificationToast,
    trackedPositions,
  }) => {
    const orderNumbersBefore = await positionsTable.getOrderNumbers();
    await orderPanel.placeMarketOrder({ side: 'Buy', volume: instrument.minVolume });

    await expect.soft(notificationToast.message(TOAST_MESSAGES.positionCreated)).toBeVisible();

    const orderNo = await waitForNewOrderNumber(() => positionsTable.getOrderNumbers(), orderNumbersBefore, 'Open Positions');
    trackedPositions.push(orderNo);
  });

  test('TC-6.02 should list the order in the bell notifications @regression', async ({
    notificationBell,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });

    await notificationBell.openPositionNotifications();

    await expect(notificationBell.notification(orderNo, NOTIFICATION_TITLES.positionCreated)).toBeVisible();
  });

  test('TC-6.03 should notify when a position is closed @regression', async ({
    positionsTable,
    closePositionDialog,
    notificationToast,
    notificationBell,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });

    await positionsTable.clickClose(orderNo);
    await closePositionDialog.closeVolume(instrument.minVolume);

    await expect(notificationToast.message(TOAST_MESSAGES.positionClosed)).toBeVisible();
    await notificationBell.openPositionNotifications();
    await expect(notificationBell.notification(orderNo, NOTIFICATION_TITLES.positionClosed)).toBeVisible();
  });

  test('TC-6.04 should show a filled market order in Orders & Deals @smoke @regression', async ({
    ordersAndDealsTable,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });

    await ordersAndDealsTable.open();
    const order = await ordersAndDealsTable.getOrder(orderNo);

    expect(order.state).toBe('FILLED');
    expect(order.deals.length).toBeGreaterThan(0);
  });

  test('TC-6.05 should show a closed position in Positions History @regression', async ({
    positionsTable,
    closePositionDialog,
    notificationToast,
    positionsHistoryTable,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });
    const position = await positionsTable.getPosition(orderNo);

    await positionsTable.clickClose(orderNo);
    await closePositionDialog.closeVolume(instrument.minVolume);
    await notificationToast.waitForMessage(TOAST_MESSAGES.positionClosed);

    await positionsHistoryTable.open();
    const [closedPosition] = await positionsHistoryTable.getClosedPositions(orderNo);
    expect(closedPosition.symbol).toBe(instrument.symbol);
    expect(closedPosition.type).toBe('BUY');
    expect(closedPosition.entryPrice).toBe(position.entryPrice);
    expect(closedPosition.closePrice).toBeWithinTolerance(position.currentPrice, instrument.priceTolerance);
    expect(closedPosition.closeDate).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test("TC-6.06 should find today's order when the date range covers today @regression", async ({
    tradePage,
    ordersAndDealsTable,
    dateRangePicker,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });
    const today = toDayMonthYear(await tradePage.getServerTime());

    await ordersAndDealsTable.open();
    await dateRangePicker.selectPreset('Last 7 days');

    expect((await dateRangePicker.getRange()).to).toBe(today);
    await expect(ordersAndDealsTable.orderRow(orderNo)).toBeVisible();
  });
});
