export const SL_TP_MESSAGES = {
  buyStopLossTooHigh: 'Stop Loss must be less than Sell Price.',
  buyTakeProfitTooLow: 'Take Profit must be greater than Sell Price.',
  sellStopLossTooLow: 'Stop Loss must be greater than Buy Price.',
  sellTakeProfitTooHigh: 'Take Profit must be less than Buy Price.',
};

export const PENDING_SL_TP_MESSAGES = {
  buyStopLossTooHigh: 'Stop Loss must be less than price.',
  buyTakeProfitTooLow: 'Take Profit must be greater than price.',
};

export const TOAST_MESSAGES = {
  positionCreated: 'Position has been created.',
  positionClosed: 'Position has been closed.',
  orderCreated: 'Order has been created.',
  orderUpdated: 'Order has been updated.',
  orderDeleted: 'Order has been deleted.',
  invalidPrice: 'Invalid Price submitted.',
};

export const NOTIFICATION_TITLES = {
  positionCreated: 'Position Created',
  positionClosed: 'Position Closed',
};

export function minimumVolumeMessage(minVolume: number): string {
  return `Minimum volume is ${minVolume}.`;
}
