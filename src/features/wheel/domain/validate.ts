import type { ResultId, WheelConfig } from "./types";

const IDS: readonly ResultId[] = ["coffee", "wine", "mainPrize", "noPrize"];

export function validateConfig(config: WheelConfig): void {
  if (config.segments.length !== 8 || Object.keys(config.results).length !== 4) {
    throw new Error("Das Rad braucht acht Segmente und vier Ergebnisse.");
  }
  const seen = new Set<string>();
  for (const segment of config.segments) {
    if (!segment.id || seen.has(segment.id)) throw new Error("Segment-IDs müssen eindeutig sein.");
    seen.add(segment.id);
    if (!IDS.includes(segment.resultId) || !config.results[segment.resultId]) {
      throw new Error("Unbekanntes Ergebnis.");
    }
    if ("weight" in segment) throw new Error("Gewichtete Segmente werden nicht unterstützt.");
    if (![segment.fill, segment.foreground].every((color) => /^#[0-9a-f]{6}$/i.test(color))) {
      throw new Error("Ungültige Segmentfarbe.");
    }
  }
  for (const id of IDS) {
    const result = config.results[id];
    if (!result || result.id !== id || !result.label || !result.headline || !result.description) {
      throw new Error("Unvollständiges Ergebnis.");
    }
    if ("weight" in result) throw new Error("Gewichtete Ergebnisse werden nicht unterstützt.");
    if (config.segments.filter((segment) => segment.resultId === id).length !== 2) {
      throw new Error("Jedes Ergebnis muss genau zweimal vorkommen.");
    }
  }
}
