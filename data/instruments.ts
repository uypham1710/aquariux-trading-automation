export interface Instrument {
  symbol: string;
  pointSize: number;
  digits: number;
  minVolume: number;
  contractSize: number;
  priceTolerance: number;
}

export const XAUUSD: Instrument = {
  symbol: 'XAUUSD',
  pointSize: 0.01,
  digits: 2,
  minVolume: 0.1,
  contractSize: 100,
  priceTolerance: 1.0,
};

export const GBPCAD: Instrument = {
  symbol: 'GBPCAD',
  pointSize: 0.00001,
  digits: 5,
  minVolume: 0.1,
  contractSize: 100_000,
  priceTolerance: 0.0005,
};
