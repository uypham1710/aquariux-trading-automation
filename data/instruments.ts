export interface Instrument {
  symbol: string;
  pointSize: number;
  // Decimal places shown in the UI; used to round computed SL/TP/pending prices.
  digits: number;
  minVolume: number;
  contractSize: number;
  // Largest accepted gap between the price read before placing an order and the fill price.
  // Prices move between reading and filling (and the VPN adds delay), so this is not zero.
  priceTolerance: number;
}

export const XAUUSD: Instrument = {
  symbol: 'XAUUSD',
  pointSize: 0.01,
  digits: 2,
  minVolume: 0.1,
  contractSize: 100,
  // Assumption: gold rarely moves more than 1.00 (100 points) in the few seconds an order takes.
  priceTolerance: 1.0,
};

export const GBPCAD: Instrument = {
  symbol: 'GBPCAD',
  pointSize: 0.00001,
  digits: 5,
  // TODO: verify minimum volume for FX pairs in app
  minVolume: 0.1,
  contractSize: 100_000,
  priceTolerance: 0.0005,
};
