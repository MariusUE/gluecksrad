"use client";

import { RESULTS, WHEEL_CONFIG } from "../config/wheel";
import type { AnimationFactory, RandomSource } from "../domain/types";
import { validateConfig } from "../domain/validate";
import { useWheelGame } from "../useWheelGame";
import { Wheel } from "./Wheel";
import { ResultDialog } from "./ResultDialog";
import styles from "./game.module.css";

validateConfig(WHEEL_CONFIG);

export function PrizeWheelGame({ random, animate }: { random?: RandomSource; animate?: AnimationFactory }) {
  const { state, svgRef, buttonRef, activate, reset } = useWheelGame({ random, animate });
  const segment = state.target === null ? null : WHEEL_CONFIG.segments[state.target];
  const result = state.phase === "RESULT" && segment ? RESULTS[segment.resultId] : null;
  const status = state.phase === "STARTING" ? "Das Rad startet."
    : state.phase === "SPINNING" ? "Das Spiel läuft. Zum Stoppen erneut auf das Rad drücken."
      : state.phase === "DECELERATING" ? "Das Rad bremst ab. Gleich steht dein Ergebnis fest."
        : state.phase === "RESULT" ? "Das Rad steht. Dein Ergebnis ist da." : "Bereit für dein Glück?";

  return <div className={styles.page}>
    <main className={styles.main}>
      <h1 className="sr-only">Thüringen-Glücksrad</h1>
      <p className="sr-only" id="wheel-instructions">Drücke auf das Rad, um es zu drehen. Drücke noch einmal, um es zu stoppen.</p>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      <section className={styles.playArea} aria-label="Glücksrad mit acht Feldern">
        <Wheel phase={state.phase} target={state.target} svgRef={svgRef} buttonRef={buttonRef} onActivate={activate} />
        {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
      </section>
    </main>
    <ResultDialog result={result} onClose={reset} />
  </div>;
}
