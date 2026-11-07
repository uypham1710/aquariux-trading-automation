import { test as base, expect as baseExpect } from '@playwright/test';
import { TradePage } from '../pages/TradePage';
import { OrderPanel, MarketOrder, PendingOrder } from '../components/OrderPanel';
import { PositionsTable } from '../components/PositionsTable';
import { EditPositionDialog } from '../components/EditPositionDialog';
import { ClosePositionDialog } from '../components/ClosePositionDialog';
import { NotificationToast } from '../components/NotificationToast';
import { OrdersAndDealsTable } from '../components/OrdersAndDealsTable';
import { PositionsHistoryTable } from '../components/PositionsHistoryTable';
import { PendingOrdersTable } from '../components/PendingOrdersTable';
import { EditPendingOrderDialog } from '../components/EditPendingOrderDialog';
import { DeletePendingOrderDialog } from '../components/DeletePendingOrderDialog';
import { NotificationBell } from '../components/NotificationBell';
import { DateRangePicker } from '../components/DateRangePicker';
import { SettingsMenu } from '../components/SettingsMenu';
import { BulkActionsMenu } from '../components/BulkActionsMenu';
import { TOAST_MESSAGES } from '../data/messages';
import { waitForNewOrderNumber } from '../utils/orders';

type TradingFixtures = {
  tradePage: TradePage;
  orderPanel: OrderPanel;
  positionsTable: PositionsTable;
  editPositionDialog: EditPositionDialog;
  closePositionDialog: ClosePositionDialog;
  notificationToast: NotificationToast;
  ordersAndDealsTable: OrdersAndDealsTable;
  positionsHistoryTable: PositionsHistoryTable;
  pendingOrdersTable: PendingOrdersTable;
  editPendingOrderDialog: EditPendingOrderDialog;
  deletePendingOrderDialog: DeletePendingOrderDialog;
  notificationBell: NotificationBell;
  dateRangePicker: DateRangePicker;
  settingsMenu: SettingsMenu;
  bulkActionsMenu: BulkActionsMenu;

  trackedPositions: string[];
  trackedPendingOrders: string[];

  openPosition: (order: MarketOrder, options?: { oneClickTrading?: boolean }) => Promise<string>;
  placePendingOrder: (order: PendingOrder) => Promise<string>;
  oneClickTrading: void;
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

  ordersAndDealsTable: async ({ page }, use) => {
    await use(new OrdersAndDealsTable(page));
  },

  positionsHistoryTable: async ({ page }, use) => {
    await use(new PositionsHistoryTable(page));
  },

  pendingOrdersTable: async ({ page }, use) => {
    await use(new PendingOrdersTable(page));
  },

  editPendingOrderDialog: async ({ page }, use) => {
    await use(new EditPendingOrderDialog(page));
  },

  deletePendingOrderDialog: async ({ page }, use) => {
    await use(new DeletePendingOrderDialog(page));
  },

  notificationBell: async ({ page }, use) => {
    await use(new NotificationBell(page));
  },

  dateRangePicker: async ({ page }, use) => {
    await use(new DateRangePicker(page));
  },

  settingsMenu: async ({ page }, use) => {
    await use(new SettingsMenu(page));
  },

  bulkActionsMenu: async ({ page }, use) => {
    await use(new BulkActionsMenu(page));
  },

  trackedPositions: async ({ tradePage, positionsTable, closePositionDialog }, use) => {
    const orderNumbers: string[] = [];
    await use(orderNumbers);

    await tradePage.open();
    await positionsTable.open();
    // One failed close must not stop the others: every position left open stays on the shared
    // account. Failures are collected and reported together at the end.
    const failures: string[] = [];
    for (const orderNo of orderNumbers) {
      try {
        if (await positionsTable.isPositionOpen(orderNo)) {
          const { volume } = await positionsTable.getPosition(orderNo);
          await positionsTable.clickClose(orderNo);
          await closePositionDialog.closeVolume(volume);
          await positionsTable.waitForPositionClosed(orderNo);
        }
      } catch (error) {
        failures.push(`${orderNo}: ${(error as Error).message}`);
        // The failed step may have left a dialog open on top of the table.
        await tradePage.open();
        await positionsTable.open();
      }
    }
    if (failures.length > 0) {
      throw new Error(`Cleanup could not close these positions:\n${failures.join('\n')}`);
    }
  },

  trackedPendingOrders: async ({ tradePage, pendingOrdersTable, deletePendingOrderDialog }, use) => {
    const orderNumbers: string[] = [];
    await use(orderNumbers);

    await tradePage.open();
    await pendingOrdersTable.open();
    // Same as trackedPositions: keep going after a failure and report all of them at the end.
    const failures: string[] = [];
    for (const orderNo of orderNumbers) {
      try {
        if (await pendingOrdersTable.isOrderPending(orderNo)) {
          await pendingOrdersTable.clickDelete(orderNo);
          await deletePendingOrderDialog.confirm();
          await pendingOrdersTable.waitForOrderRemoved(orderNo);
        }
      } catch (error) {
        failures.push(`${orderNo}: ${(error as Error).message}`);
        await tradePage.open();
        await pendingOrdersTable.open();
      }
    }
    if (failures.length > 0) {
      throw new Error(`Cleanup could not delete these pending orders:\n${failures.join('\n')}`);
    }
  },

  openPosition: async ({ orderPanel, positionsTable, notificationToast, trackedPositions }, use) => {
    await use(async (order, options = {}) => {
      await positionsTable.open();
      const orderNumbersBefore = await positionsTable.getOrderNumbers();

      if (options.oneClickTrading) {
        await orderPanel.fillMarketOrder(order);
        await orderPanel.clickPlaceOrder();
      } else {
        await orderPanel.placeMarketOrder(order);
      }
      await notificationToast.waitForMessage(TOAST_MESSAGES.positionCreated);

      const orderNo = await waitForNewOrderNumber(() => positionsTable.getOrderNumbers(), orderNumbersBefore, 'Open Positions');
      trackedPositions.push(orderNo);
      return orderNo;
    });
  },

  placePendingOrder: async ({ orderPanel, pendingOrdersTable, notificationToast, trackedPendingOrders }, use) => {
    await use(async (order) => {
      await pendingOrdersTable.open();
      const orderNumbersBefore = await pendingOrdersTable.getOrderNumbers();

      await orderPanel.placePendingOrder(order);
      await notificationToast.waitForMessage(TOAST_MESSAGES.orderCreated);

      const orderNo = await waitForNewOrderNumber(
        () => pendingOrdersTable.getOrderNumbers(),
        orderNumbersBefore,
        'Pending Orders',
      );
      trackedPendingOrders.push(orderNo);
      return orderNo;
    });
  },

  oneClickTrading: async ({ settingsMenu, trackedPositions, trackedPendingOrders }, use) => {
    await settingsMenu.enableOneClickTrading();
    await settingsMenu.close();
    await use();
    await settingsMenu.disableOneClickTrading();
    await settingsMenu.close();
  },
});

export const expect = baseExpect.extend({
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
