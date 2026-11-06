// Texts copied from the app. A Buy closes at the Sell price, so its SL/TP are checked
// against the Sell price, and the other way round for a Sell.
export const SL_TP_MESSAGES = {
  buyStopLossTooHigh: 'Stop Loss must be less than Sell Price.',
  buyTakeProfitTooLow: 'Take Profit must be greater than Sell Price.',
  sellStopLossTooLow: 'Stop Loss must be greater than Buy Price.',
  sellTakeProfitTooHigh: 'Take Profit must be less than Buy Price.',
};

export const TOAST_MESSAGES = {
  positionCreated: 'Position has been created.',
  positionClosed: 'Position has been closed.',
};

export function minimumVolumeMessage(minVolume: number): string {
  return `Minimum volume is ${minVolume}.`;
}
