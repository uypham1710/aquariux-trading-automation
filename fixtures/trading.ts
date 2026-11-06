import { test as base, expect as baseExpect } from '@playwright/test';
import { TradePage } from '../pages/TradePage';
import { OrderPanel, MarketOrder } from '../components/OrderPanel';
import { PositionsTable } from '../components/PositionsTable';
import { EditPositionDialog } from '../components/EditPositionDialog';
import { ClosePositionDialog } from '../components/ClosePositionDialog';
import { NotificationToast } from '../components/NotificationToast';
import { TOAST_MESSAGES } from '../data/messages';

type TradingFixtures = {
  tradePage: TradePage;
  orderPanel: OrderPanel;
  positionsTable: PositionsTable;
  editPositionDialog: EditPositionDialog;
  closePositionDialog: ClosePositionDialog;
  notificationToast: NotificationToast;
  // Places a market order and returns the Order No. of the new position.
  // Every position opened this way is closed after the test, even if the test fails.
  openPosition: (order: MarketOrder) => Promise<string>;
};

export const test = base.extend<TradingFixtures>({
  tradePage: async ({ page }, use) => {
    const tradePage = new TradePage(page);
    await tradePage.open();
    await use(tradePage);
  },

  orderPanel: async ({ page }, use) => {
    await use(new OrderPanel(page));
  },

  positionsTable: async ({ page }, use) => {
    await use(new PositionsTable(page));
  },

  editPositionDialog: async ({ page }, use) => {
    await use(new EditPositionDialog(page));
  },

  closePositionDialog: async ({ page }, use) => {
    await use(new ClosePositionDialog(page));
  },

  notificationToast: async ({ page }, use) => {
    await use(new NotificationToast(page));
  },

  openPosition: async ({ tradePage, orderPanel, positionsTable, closePositionDialog, notificationToast }, use) => {
    const openedOrderNumbers: string[] = [];

    await use(async (order: MarketOrder) => {
      const orderNumbersBefore = await positionsTable.getOrderNumbers();
      await orderPanel.placeMarketOrder(order);
      // The toast confirms the server accepted the order. If the order is rejected,
      // the test fails here with a clear reason instead of timing out on the table.
      await notificationToast.waitForMessage(TOAST_MESSAGES.positionCreated);

      // The new position is the one whose Order No. was not in the table before.
      // We never take "the first row": the shared account may hold other positions.
      let newOrderNo = '';
      await baseExpect
        .poll(
          async () => {
            const orderNumbersNow = await positionsTable.getOrderNumbers();
            newOrderNo = orderNumbersNow.find((orderNo) => !orderNumbersBefore.includes(orderNo)) ?? '';
            return newOrderNo;
          },
          // Over the VPN the new row has been seen to take more than 15s to appear after the toast.
          { message: 'Waiting for the new position to appear in Open Positions', timeout: 30_000 },
        )
        .not.toBe('');

      openedOrderNumbers.push(newOrderNo);
      return newOrderNo;
    });

    // Reload first: a failed test may have left a dialog open on top of the table.
    await tradePage.open();
    await positionsTable.open();
    for (const orderNo of openedOrderNumbers) {
      if (await positionsTable.isPositionOpen(orderNo)) {
        const { volume } = await positionsTable.getPosition(orderNo);
        await positionsTable.clickClose(orderNo);
        await closePositionDialog.closeVolume(volume);
        await positionsTable.waitForPositionClosed(orderNo);
      }
    }
  },
});

export const expect = baseExpect.extend({
  // Prices move between reading them and the order filling, so exact equality would be flaky.
  // Accepts null because empty SL/TP cells are parsed as null; null never passes.
  toBeWithinTolerance(received: number | null, expected: number, tolerance: number) {
    if (received === null) {
      return {
        pass: false,
        name: 'toBeWithinTolerance',
        message: () => `expected a number within ${tolerance} of ${expected}, but the value was empty`,
      };
    }
    const difference = Math.abs(received - expected);
    const pass = difference <= tolerance;
    return {
      pass,
      name: 'toBeWithinTolerance',
      expected,
      actual: received,
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within ${tolerance} of ${expected} ` +
        `(difference ${difference})`,
    };
  },
});
