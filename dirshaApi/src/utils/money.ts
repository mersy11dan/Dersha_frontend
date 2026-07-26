/**
 * Money and share-quantity helpers.
 *
 * The database stores cash as DECIMAL(18,4) and shares as DECIMAL(18,6), and
 * the mysql2 driver returns those as strings to avoid silent precision loss.
 * These helpers are the single place where that conversion happens, and every
 * arithmetic result is re-rounded to the column's scale so repeated operations
 * cannot accumulate binary floating-point drift.
 */

const CASH_SCALE = 4;
const SHARE_SCALE = 6;

function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot round a non-finite value: ${value}`);
  }
  // Scale-shift via exponent notation to dodge the classic 1.005 rounding bug.
  const shifted = Number(`${value}e${decimals}`);
  return Number(`${Math.round(shifted)}e-${decimals}`);
}

/** Parses a DECIMAL(18,4) cash column into a number rounded to 4 places. */
export function toCash(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return roundTo(typeof value === "string" ? parseFloat(value) : value, CASH_SCALE);
}

/** Parses a DECIMAL(18,6) share column into a number rounded to 6 places. */
export function toShares(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return roundTo(typeof value === "string" ? parseFloat(value) : value, SHARE_SCALE);
}

export const roundCash = (value: number): number => roundTo(value, CASH_SCALE);
export const roundShares = (value: number): number => roundTo(value, SHARE_SCALE);

/** Formats a number for insertion into a DECIMAL(18,4) column. */
export const cashLiteral = (value: number): string =>
  roundCash(value).toFixed(CASH_SCALE);

/** Formats a number for insertion into a DECIMAL(18,6) column. */
export const shareLiteral = (value: number): string =>
  roundShares(value).toFixed(SHARE_SCALE);

/**
 * Compares two cash amounts allowing for sub-cent representation error.
 * Returns true when `a` is greater than or equal to `b`.
 */
export function cashGte(a: number, b: number): boolean {
  return roundCash(a - b) >= -0.00005;
}

export function sharesGte(a: number, b: number): boolean {
  return roundShares(a - b) >= -0.0000005;
}
