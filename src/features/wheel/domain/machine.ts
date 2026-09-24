import type { GamePhase } from "./types";

export interface GameState {
  readonly phase: GamePhase;
  readonly target: number | null;
  readonly error: string | null;
}

export type GameEvent =
  | { type: "START"; target: number }
  | { type: "READY" | "STOP" | "FINISH" | "CLOSE" | "RESET" }
  | { type: "FAIL"; message: string };

export const INITIAL_STATE: GameState = { phase: "IDLE", target: null, error: null };

export function transition(state: GameState, event: GameEvent): GameState {
  if (event.type === "FAIL") return { ...INITIAL_STATE, error: event.message };
  switch (event.type) {
    case "START":
      return state.phase === "IDLE" && Number.isInteger(event.target) && event.target >= 0 && event.target < 8
        ? { phase: "STARTING", target: event.target, error: null } : state;
    case "READY": return state.phase === "STARTING" ? { ...state, phase: "SPINNING" } : state;
    case "STOP": return state.phase === "SPINNING" ? { ...state, phase: "DECELERATING" } : state;
    case "FINISH": return state.phase === "DECELERATING" ? { ...state, phase: "RESULT" } : state;
    case "CLOSE": return state.phase === "RESULT" ? { ...state, phase: "RESET" } : state;
    case "RESET": return state.phase === "RESET" ? INITIAL_STATE : state;
  }
}
