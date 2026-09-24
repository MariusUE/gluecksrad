import type { RandomSource } from "../domain/types";

const UINT32_RANGE = 2 ** 32;

export const cryptoRandom: RandomSource = () => {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0]!;
};

/** Eight equal integer buckets; 2^32 is divisible by eight, so no modulo bias. */
export function selectSegment(random: RandomSource = cryptoRandom): number {
  const value = random();
  if (!Number.isInteger(value) || value < 0 || value >= UINT32_RANGE) {
    throw new Error("Die Zufallsquelle hat einen ungültigen Wert geliefert.");
  }
  return Math.floor(value / (UINT32_RANGE / 8));
}
