import { Instrument } from '../data/instruments';

function roundToDigits(price: number, instrument: Instrument): number {
  return Number(price.toFixed(instrument.digits));
}

export function priceAbove(referencePrice: number, points: number, instrument: Instrument): number {
  return roundToDigits(referencePrice + points * instrument.pointSize, instrument);
}

export function priceBelow(referencePrice: number, points: number, instrument: Instrument): number {
  return roundToDigits(referencePrice - points * instrument.pointSize, instrument);
}

// Pending orders are placed a percentage away from market so they do not fill during a test.
export function percentAbove(referencePrice: number, percent: number, instrument: Instrument): number {
  return roundToDigits(referencePrice * (1 + percent / 100), instrument);
}

export function percentBelow(referencePrice: number, percent: number, instrument: Instrument): number {
  return roundToDigits(referencePrice * (1 - percent / 100), instrument);
}
