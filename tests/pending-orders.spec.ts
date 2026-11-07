import { test, expect } from '../fixtures/trading';
import { XAUUSD } from '../data/instruments';
import {
  SL_TP_DISTANCE_POINTS,
  PENDING_DISTANCE_PERCENT,
  MODIFIED_PENDING_DISTANCE_PERCENT,
  STOP_LIMIT_GAP_PERCENT,
  EXPIRY_OPTIONS,
} from '../data/orders';
import { PENDING_SL_TP_MESSAGES, TOAST_MESSAGES } from '../data/messages';
import { priceAbove, priceBelow, percentAbove, percentBelow } from '../utils/prices';

const instrument = XAUUSD;

test.describe('Scope 3 - Pending orders', () => {
  test.beforeEach(async ({ tradePage, pendingOrdersTable }) => {
    await tradePage.selectSymbol(instrument);
    await pendingOrdersTable.open();
  });

  test('TC-3.01 should place Buy Limit order below market price @smoke @regression', async ({
    orderPanel,
    pendingOrdersTable,
    placePendingOrder,
  }) => {
    const price = percentBelow(await orderPanel.getAskPrice(), PENDING_DISTANCE_PERCENT, instrument);

    const orderNo = await placePendingOrder({ side: 'Buy', type: 'Limit', volume: instrument.minVolume, price });

    const order = await pendingOrdersTable.getPendingOrder(orderNo);
    expect(order.symbol).toBe(instrument.symbol);
    expect(order.type).toBe('BUY LIMIT');
    expect(order.price).toBe(price);
    expect(order.requestedVolume).toBe(instrument.minVolume);
    expect(order.filledVolume).toBe(0);
    expect(order.fillPolicy).toBe('Return');
    expect(order.expiry).toBe('Good Till Canceled');
  });

  test('TC-3.02 should place Sell Limit order above market price @regression', async ({
    orderPanel,
    pendingOrdersTable,
    placePendingOrder,
  }) => {
    const price = percentAbove(await orderPanel.getBidPrice(), PENDING_DISTANCE_PERCENT, instrument);

    const orderNo = await placePendingOrder({ side: 'Sell', type: 'Limit', volume: instrument.minVolume, price });

    const order = await pendingOrdersTable.getPendingOrder(orderNo);
    expect(order.type).toBe('SELL LIMIT');
    expect(order.price).toBe(price);
  });

  test('TC-3.03 should place Buy Stop order above market price @regression', async ({
    orderPanel,
    pendingOrdersTable,
    placePendingOrder,
  }) => {
    const price = percentAbove(await orderPanel.getAskPrice(), PENDING_DISTANCE_PERCENT, instrument);

    const orderNo = await placePendingOrder({ side: 'Buy', type: 'Stop', volume: instrument.minVolume, price });

    const order = await pendingOrdersTable.getPendingOrder(orderNo);
    expect(order.type).toBe('BUY STOP');
    expect(order.price).toBe(price);
  });

  test('TC-3.04 should place Sell Stop order below market price @regression', async ({
    orderPanel,
    pendingOrdersTable,
    placePendingOrder,
  }) => {
    const price = percentBelow(await orderPanel.getBidPrice(), PENDING_DISTANCE_PERCENT, instrument);

    const orderNo = await placePendingOrder({ side: 'Sell', type: 'Stop', volume: instrument.minVolume, price });

    const order = await pendingOrdersTable.getPendingOrder(orderNo);
    expect(order.type).toBe('SELL STOP');
    expect(order.price).toBe(price);
  });

  test('TC-3.05 should place Buy Stop Limit order with stop and limit price @regression', async ({
    orderPanel,
    pendingOrdersTable,
    placePendingOrder,
  }) => {
    const ask = await orderPanel.getAskPrice();
    const price = percentAbove(ask, PENDING_DISTANCE_PERCENT, instrument);
    const stopLimitPrice = percentAbove(ask, PENDING_DISTANCE_PERCENT - STOP_LIMIT_GAP_PERCENT, instrument);

    const orderNo = await placePendingOrder({
      side: 'Buy',
      type: 'Stop Limit',
      volume: instrument.minVolume,
      price,
      stopLimitPrice,
    });

    const order = await pendingOrdersTable.getPendingOrder(orderNo);
    expect(order.type).toBe('BUY STOP LIMIT');
    expect(order.price).toBe(price);
  });

  test('TC-3.06 should place Buy Limit order with SL and TP relative to the pending price @regression', async ({
    orderPanel,
    pendingOrdersTable,
    placePendingOrder,
  }) => {
    const price = percentBelow(await orderPanel.getAskPrice(), PENDING_DISTANCE_PERCENT, instrument);
    const stopLoss = priceBelow(price, SL_TP_DISTANCE_POINTS, instrument);
    const takeProfit = priceAbove(price, SL_TP_DISTANCE_POINTS, instrument);

    const orderNo = await placePendingOrder({
      side: 'Buy',
      type: 'Limit',
      volume: instrument.minVolume,
      price,
      stopLoss,
      takeProfit,
    });

    const order = await pendingOrdersTable.getPendingOrder(orderNo);
    expect(order.stopLoss).toBe(stopLoss);
    expect(order.takeProfit).toBe(takeProfit);
  });

  test('TC-3.07 should not place Buy Limit order when SL is above the pending price @regression', async ({
    orderPanel,
  }) => {
    const price = percentBelow(await orderPanel.getAskPrice(), PENDING_DISTANCE_PERCENT, instrument);

    await orderPanel.fillPendingOrder({
      side: 'Buy',
      type: 'Limit',
      volume: instrument.minVolume,
      price,
      stopLoss: priceAbove(price, SL_TP_DISTANCE_POINTS, instrument),
    });
    await orderPanel.clickPlaceOrder();

    await expect(orderPanel.validationMessage(PENDING_SL_TP_MESSAGES.buyStopLossTooHigh)).toBeVisible();
    await expect(orderPanel.confirmOrderButton).toBeHidden();
  });

  test('TC-3.08 should not place Buy Limit order with price above market @regression', async ({
    tradePage,
    orderPanel,
    pendingOrdersTable,
    notificationToast,
    trackedPendingOrders,
  }) => {
    const orderNumbersBefore = await pendingOrdersTable.getOrderNumbers();
    const price = percentAbove(await orderPanel.getAskPrice(), PENDING_DISTANCE_PERCENT, instrument);

    await orderPanel.placePendingOrder({ side: 'Buy', type: 'Limit', volume: instrument.minVolume, price });

    await expect(notificationToast.message(TOAST_MESSAGES.invalidPrice)).toBeVisible();

    await tradePage.open();
    await pendingOrdersTable.open();
    const newOrderNumbers = (await pendingOrdersTable.getOrderNumbers()).filter(
      (orderNo) => !orderNumbersBefore.includes(orderNo),
    );
    trackedPendingOrders.push(...newOrderNumbers);
    expect(newOrderNumbers).toEqual([]);
  });

  test('TC-3.09 should modify the price of a pending order @regression', async ({
    orderPanel,
    pendingOrdersTable,
    editPendingOrderDialog,
    notificationToast,
    placePendingOrder,
  }) => {
    const ask = await orderPanel.getAskPrice();
    const orderNo = await placePendingOrder({
      side: 'Buy',
      type: 'Limit',
      volume: instrument.minVolume,
      price: percentBelow(ask, PENDING_DISTANCE_PERCENT, instrument),
    });
    const newPrice = percentBelow(ask, MODIFIED_PENDING_DISTANCE_PERCENT, instrument);

    await pendingOrdersTable.clickEdit(orderNo);
    await editPendingOrderDialog.setPrice(newPrice);
    await editPendingOrderDialog.save();

    await expect(notificationToast.message(TOAST_MESSAGES.orderUpdated)).toBeVisible();
    await expect.poll(async () => (await pendingOrdersTable.getPendingOrder(orderNo)).price).toBe(newPrice);
  });

  test('TC-3.10 should modify SL and TP of a pending order @regression', async ({
    orderPanel,
    pendingOrdersTable,
    editPendingOrderDialog,
    placePendingOrder,
  }) => {
    const price = percentBelow(await orderPanel.getAskPrice(), PENDING_DISTANCE_PERCENT, instrument);
    const orderNo = await placePendingOrder({ side: 'Buy', type: 'Limit', volume: instrument.minVolume, price });
    const newStopLoss = priceBelow(price, SL_TP_DISTANCE_POINTS, instrument);
    const newTakeProfit = priceAbove(price, SL_TP_DISTANCE_POINTS, instrument);

    await pendingOrdersTable.clickEdit(orderNo);
    await editPendingOrderDialog.setStopLoss(newStopLoss);
    await editPendingOrderDialog.setTakeProfit(newTakeProfit);
    await editPendingOrderDialog.save();

    await expect.poll(async () => (await pendingOrdersTable.getPendingOrder(orderNo)).stopLoss).toBe(newStopLoss);
    await expect.poll(async () => (await pendingOrdersTable.getPendingOrder(orderNo)).takeProfit).toBe(newTakeProfit);
  });

  test('TC-3.11 should cancel a pending order @regression', async ({
    orderPanel,
    pendingOrdersTable,
    deletePendingOrderDialog,
    notificationToast,
    placePendingOrder,
  }) => {
    const price = percentBelow(await orderPanel.getAskPrice(), PENDING_DISTANCE_PERCENT, instrument);
    const orderNo = await placePendingOrder({ side: 'Buy', type: 'Limit', volume: instrument.minVolume, price });

    await pendingOrdersTable.clickDelete(orderNo);
    await deletePendingOrderDialog.confirm();

    await expect(notificationToast.message(TOAST_MESSAGES.orderDeleted)).toBeVisible();
    await expect(pendingOrdersTable.orderRow(orderNo)).toHaveCount(0);
  });

  for (const expiry of EXPIRY_OPTIONS) {
    test(`TC-3.12 should place pending order with expiry "${expiry}" @regression`, async ({
      tradePage,
      orderPanel,
      pendingOrdersTable,
      placePendingOrder,
    }) => {
      const price = percentBelow(await orderPanel.getAskPrice(), PENDING_DISTANCE_PERCENT, instrument);

      let expiryHour: number | undefined;
      if (expiry === 'Specified Date and Time') {
        const serverHour = Number((await tradePage.getServerTime()).slice(11, 13));
        test.skip(serverHour === 23, 'One hour later would be tomorrow; the time picker cannot change the date.');
        expiryHour = serverHour + 1;
      }

      const orderNo = await placePendingOrder({
        side: 'Buy',
        type: 'Limit',
        volume: instrument.minVolume,
        price,
        expiry,
        expiryHour,
      });

      const order = await pendingOrdersTable.getPendingOrder(orderNo);
      expect(order.expiry).toBe(expiry);
      if (expiry === 'Good Till Canceled') {
        expect(order.expiryDate).toBe('--');
      } else {
        expect(order.expiryDate).not.toBe('--');
      }
    });
  }
});
