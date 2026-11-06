import { Instrument } from '../data/instruments';

// Rounding is needed because 4089.5 - 5.0 in floating point can give 4084.499999...
function roundToDigits(price: number, instrument: Instrument): number {
  return Number(price.toFixed(instrument.digits));
}

export function priceAbove(referencePrice: number, points: number, instrument: Instrument): number {
  return roundToDigits(referencePrice + points * instrument.pointSize, instrument);
}

export function priceBelow(referencePrice: number, points: number, instrument: Instrument): number {
  return roundToDigits(referencePrice - points * instrument.pointSize, instrument);
}
