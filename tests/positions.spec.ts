import { test, expect } from '../fixtures/trading';
import { XAUUSD } from '../data/instruments';
import { SL_TP_DISTANCE_POINTS, MODIFIED_SL_TP_DISTANCE_POINTS } from '../data/orders';
import { SL_TP_MESSAGES } from '../data/messages';
import { priceAbove, priceBelow } from '../utils/prices';

const instrument = XAUUSD;

test.describe('Scope 4 - Open positions', () => {
  test.beforeEach(async ({ tradePage, orderPanel, positionsTable }) => {
    await tradePage.selectSymbol(instrument);
    test.skip(await orderPanel.isMarketClosed(), `Market is closed for ${instrument.symbol}; orders cannot be placed`);
    await positionsTable.open();
  });

  test('TC-4.01 should show a new position with correct column values @regression', async ({
    orderPanel,
    positionsTable,
    openPosition,
  }) => {
    const ask = await orderPanel.getAskPrice();
    const stopLoss = priceBelow(ask, SL_TP_DISTANCE_POINTS, instrument);
    const takeProfit = priceAbove(ask, SL_TP_DISTANCE_POINTS, instrument);

    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume, stopLoss, takeProfit });

    const position = await positionsTable.getPosition(orderNo);
    expect(position.symbol).toBe(instrument.symbol);
    expect(position.type).toBe('BUY');
    expect(position.volume).toBe(instrument.minVolume);
    expect(position.units).toBe(instrument.minVolume * instrument.contractSize);
    expect(position.entryPrice).toBeWithinTolerance(ask, instrument.priceTolerance);
    expect(position.stopLoss).toBe(stopLoss);
    expect(position.takeProfit).toBe(takeProfit);
  });

  test('TC-4.02 should modify SL and TP of an open position @regression', async ({
    positionsTable,
    editPositionDialog,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });
    const { currentPrice } = await positionsTable.getPosition(orderNo);
    const newStopLoss = priceBelow(currentPrice, MODIFIED_SL_TP_DISTANCE_POINTS, instrument);
    const newTakeProfit = priceAbove(currentPrice, MODIFIED_SL_TP_DISTANCE_POINTS, instrument);

    await positionsTable.clickEdit(orderNo);
    await editPositionDialog.updateStopLossAndTakeProfit(newStopLoss, newTakeProfit);

    await expect.poll(async () => (await positionsTable.getPosition(orderNo)).stopLoss).toBe(newStopLoss);
    await expect.poll(async () => (await positionsTable.getPosition(orderNo)).takeProfit).toBe(newTakeProfit);
  });

  test('TC-4.03 should not save SL above current price for a Buy position @regression', async ({
    orderPanel,
    positionsTable,
    editPositionDialog,
    openPosition,
  }) => {
    const ask = await orderPanel.getAskPrice();
    const originalStopLoss = priceBelow(ask, SL_TP_DISTANCE_POINTS, instrument);
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume, stopLoss: originalStopLoss });
    const { currentPrice } = await positionsTable.getPosition(orderNo);

    await positionsTable.clickEdit(orderNo);
    await editPositionDialog.setStopLoss(priceAbove(currentPrice, SL_TP_DISTANCE_POINTS, instrument));
    await editPositionDialog.clickUpdate();

    await expect(editPositionDialog.validationMessage(SL_TP_MESSAGES.buyStopLossTooHigh)).toBeVisible();
    expect((await positionsTable.getPosition(orderNo)).stopLoss).toBe(originalStopLoss);
  });

  test('TC-4.04 should close an open position @smoke @regression', async ({
    positionsTable,
    closePositionDialog,
    openPosition,
  }) => {
    const orderNo = await openPosition({ side: 'Buy', volume: instrument.minVolume });

    await positionsTable.clickClose(orderNo);
    await closePositionDialog.closeVolume(instrument.minVolume);

    await expect(positionsTable.positionRow(orderNo)).toHaveCount(0);
  });

  test('TC-4.05 should partially close an open position @regression', async ({
    positionsTable,
    closePositionDialog,
    openPosition,
  }) => {
    const openVolume = instrument.minVolume * 2;
    const orderNo = await openPosition({ side: 'Buy', volume: openVolume });

    await positionsTable.clickClose(orderNo);
    await closePositionDialog.closeVolume(instrument.minVolume);

    await expect.poll(async () => (await positionsTable.getPosition(orderNo)).volume).toBe(instrument.minVolume);
  });
});
