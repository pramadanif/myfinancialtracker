/**
 * Unit test: formatCurrencyShort precision.
 * Usage: node scripts/test-format.mjs
 */

function formatShortUnit(value, decimals) {
  return value.toFixed(decimals).replace(".", ",");
}

function formatCurrencyShort(amount) {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${sign}Rp${formatShortUnit(abs / 1_000_000, 3)}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp${formatShortUnit(abs / 1_000, 2)}rb`;
  }
  return `Rp${abs}`;
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`FAIL ${label}: expected "${expected}", got "${actual}"`);
  }
}

assertEqual(formatCurrencyShort(9_132_000), "Rp9,132jt", "9.132jt");
assertEqual(formatCurrencyShort(9_100_000), "Rp9,100jt", "9.100jt");
assertEqual(formatCurrencyShort(913_200), "Rp913,20rb", "913.2rb");
assertEqual(formatCurrencyShort(150_000), "Rp150,00rb", "150rb");

console.log("✓ formatCurrencyShort tests passed");
