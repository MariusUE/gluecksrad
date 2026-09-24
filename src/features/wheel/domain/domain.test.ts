import { describe, expect, it, vi } from "vitest";
import { WHEEL_CONFIG, RESULTS } from "../config/wheel";
import { validateConfig } from "./validate";
import type { WheelConfig } from "./types";
import { INITIAL_STATE, transition, type GameEvent, type GameState } from "./machine";
import { cryptoRandom, selectSegment } from "../selection/uniform";
import { centerAngle, crossingNumber, normalizeAngle, polar, segmentPath, targetRotation } from "../animation/geometry";

describe("canonical configuration", () => {
  it("has exactly eight equally likely fields with a consistent color for each symbol", () => {
    expect(() => validateConfig(WHEEL_CONFIG)).not.toThrow();
    expect(WHEEL_CONFIG.segments.map((s) => [s.resultId, s.fill])).toEqual([
      ["coffee", "#F6FBFF"], ["wine", "#DDEFFA"], ["mainPrize", "#F6FBFF"], ["noPrize", "#DDEFFA"],
      ["wine", "#F6FBFF"], ["coffee", "#DDEFFA"], ["noPrize", "#F6FBFF"], ["mainPrize", "#DDEFFA"],
    ]);
    for (const id of Object.keys(RESULTS)) {
      const segments = WHEEL_CONFIG.segments.filter((s) => s.resultId === id);
      expect(segments).toHaveLength(2);
      expect(segments[0]!.foreground).toBe(segments[1]!.foreground);
    }
  });
  it("preserves all supplied descriptions, including Hüfte", () => {
    expect(Object.values(RESULTS).map((r) => r.description)).toEqual([
      "Premium-Kaffee von der Thüringer DenkMahl Rösterei",
      "Prämierter Wein vom Thüringer Weingut Bad Sulza",
      "Hauptgewinn! „Hüfte“ mit deiner Visitenkarte & Newsletter-Anmeldung in den Lostopf für einen Freiplatz auf unserer B2B-Entdeckungsreise vom 29. bis 31.10.26",
      "Niete – aber keine Sorge, in Thüringen geht niemand leer aus! Melde dich zu unserem Newsletter an & folge uns bei LinkedIn!",
    ]);
  });
  it.each([
    (c: WheelConfig) => ({ ...c, segments: c.segments.slice(1) }),
    (c: WheelConfig) => ({ ...c, segments: c.segments.map((s) => ({ ...s, id: "same" })) }),
    (c: WheelConfig) => ({ ...c, segments: c.segments.map((s) => ({ ...s, resultId: "invalid" })) }),
    (c: WheelConfig) => ({ ...c, segments: c.segments.map((s) => ({ ...s, resultId: "coffee" })) }),
    (c: WheelConfig) => ({ ...c, segments: c.segments.map((s) => ({ ...s, fill: "red" })) }),
    (c: WheelConfig) => ({ ...c, segments: c.segments.map((s) => ({ ...s, weight: 2 })) }),
    (c: WheelConfig) => ({ ...c, results: { ...c.results, coffee: { ...c.results.coffee, weight: 3 } } }),
    (c: WheelConfig) => ({ ...c, results: { ...c.results, coffee: { ...c.results.coffee, description: "" } } }),
  ])("rejects invalid configuration %#", (change) => {
    expect(() => validateConfig(change(WHEEL_CONFIG) as WheelConfig)).toThrow();
  });
});

describe("uniform Web Crypto selection", () => {
  it.each(Array.from({ length: 8 }, (_, i) => i))("tests both bucket boundaries for field %i", (index) => {
    const bucket = 2 ** 32 / 8;
    expect(selectSegment(() => index * bucket)).toBe(index);
    expect(selectSegment(() => (index + 1) * bucket - 1)).toBe(index);
  });
  it.each([-1, 0.1, NaN, Infinity, 2 ** 32])("rejects %s", (value) => {
    expect(() => selectSegment(() => value)).toThrow();
  });
  it("samples exactly once", () => {
    const source = vi.fn(() => 2 ** 32 - 1);
    expect(selectSegment(source)).toBe(7);
    expect(source).toHaveBeenCalledTimes(1);
  });
  it("uses getRandomValues with a single Uint32", () => {
    const get = vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
      (array as Uint32Array)[0] = 123;
      return array;
    });
    expect(cryptoRandom()).toBe(123);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0]![0]).toBeInstanceOf(Uint32Array);
  });
});

describe("geometry", () => {
  it.each(Array.from({ length: 8 }, (_, i) => i))("aligns field %i exactly, from all representative starting angles", (index) => {
    for (const current of [-720, -12.5, 0, 22.5, 45, 71.99, 359.999, 360, 10000.123, 1_000_000]) {
      const end = targetRotation(current, index);
      expect(normalizeAngle(end + centerAngle(index))).toBeCloseTo(0, 6);
      expect(end - current).toBeGreaterThanOrEqual(720 - 1e-9);
      expect(end - current).toBeLessThan(1080);
      expect(2 * (end - current) / 360).toBeGreaterThanOrEqual(4);
      expect(2 * (end - current) / 360).toBeLessThan(6);
    }
  });
  it("shares SVG and click boundary origins", () => {
    expect(polar(0, 100)).toEqual({ x: 300, y: 200 });
    expect(polar(90, 100).x).toBeCloseTo(400);
    expect(segmentPath(0)).toContain("A 286 286 0 0 1");
    expect(crossingNumber(22.499)).toBe(0);
    expect(crossingNumber(22.5)).toBe(1);
    expect(crossingNumber(67.5)).toBe(2);
    expect(targetRotation(0, 0, 0)).toBe(0);
  });
  it("rejects invalid angles and indices", () => {
    expect(() => targetRotation(NaN, 0)).toThrow();
    expect(() => targetRotation(0, 8)).toThrow();
    expect(() => targetRotation(0, -1)).toThrow();
    expect(() => targetRotation(0, 2.5)).toThrow();
    expect(() => targetRotation(0, 0, -1)).toThrow();
  });
});

describe("state transitions", () => {
  const path: GameEvent[] = [{ type: "START", target: 7 }, { type: "READY" }, { type: "STOP" }, { type: "FINISH" }, { type: "CLOSE" }, { type: "RESET" }];
  it("follows the complete manual-stop lifecycle and preserves the target until reset", () => {
    let state = INITIAL_STATE;
    const phases = ["STARTING", "SPINNING", "DECELERATING", "RESULT", "RESET", "IDLE"];
    path.forEach((event, index) => {
      state = transition(state, event);
      expect(state.phase).toBe(phases[index]);
      expect(state.target).toBe(index < 5 ? 7 : null);
    });
  });
  it("ignores every out-of-order transition and reroll attempt", () => {
    let state: GameState = INITIAL_STATE;
    for (const valid of path) {
      for (const event of path.filter((e) => e.type !== valid.type)) expect(transition(state, event)).toBe(state);
      state = transition(state, valid);
    }
    expect(transition(INITIAL_STATE, { type: "START", target: 8 })).toBe(INITIAL_STATE);
  });
  it("recovers to a usable state on failure", () => {
    const state = transition(INITIAL_STATE, path[0]!);
    expect(transition(state, { type: "FAIL", message: "Fehler" })).toEqual({ phase: "IDLE", target: null, error: "Fehler" });
  });
});
