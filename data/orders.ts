export const SL_TP_DISTANCE_POINTS = 500;

export const MODIFIED_SL_TP_DISTANCE_POINTS = 800;

export const BELOW_MIN_VOLUME = 0.01;

export const PENDING_DISTANCE_PERCENT = 5;
export const MODIFIED_PENDING_DISTANCE_PERCENT = 6;
export const STOP_LIMIT_GAP_PERCENT = 1;

export const EXPIRY_OPTIONS = ['Good Till Canceled', 'Good Till Day', 'Specified Date', 'Specified Date and Time'] as const;
export type ExpiryOption = (typeof EXPIRY_OPTIONS)[number];
