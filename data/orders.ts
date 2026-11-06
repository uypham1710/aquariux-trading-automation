// Distances are in points from the live price. For XAUUSD (point 0.01), 500 points = 5.00.
// Far enough that the price will not touch SL/TP during a test, and far enough
// that an "invalid" price stays invalid even if the market moves a little.
export const SL_TP_DISTANCE_POINTS = 500;

// Used when modifying an open position, so the new values differ from the original ones.
export const MODIFIED_SL_TP_DISTANCE_POINTS = 800;

// Below XAUUSD minimum volume of 0.1.
export const BELOW_MIN_VOLUME = 0.01;
