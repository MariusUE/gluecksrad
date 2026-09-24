import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { WheelResult } from "../domain/types";
import { PrizeIcon } from "./PrizeIcon";
import styles from "./game.module.css";

const CONFETTI_COLORS = ["#FFB400", "#FFFFFF", "#36C3F0", "#E95891", "#1ED671"];
const FLIGHT_STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;
const FLIGHT_REACH = 0.7;

function screenLength(vw: number, cqw: number, px = 0) {
  return `calc(${vw.toFixed(2)}vw ${cqw < 0 ? "-" : "+"} ${Math.abs(cqw).toFixed(2)}cqw ${px < 0 ? "-" : "+"} ${Math.abs(px).toFixed(2)}px)`;
}

function createConfettiPieces() {
  return Array.from({ length: 40 }, (_, index) => {
    const side = index % 2 === 0 ? "left" : "right";
    const direction = side === "left" ? -1 : 1;
    const edgeTravel = 0.98 + Math.random() * 0.18;
    const overshoot = 1 + Math.random() * 7;
    const curve = (Math.random() - 0.5) * 0.3;
    const rise = 0.26 + Math.random() * 0.16;
    const fall = 0.12 + Math.random() * 0.16;
    const hoverSpread = Math.random() * 8;
    const fallSpread = (Math.random() - 0.5) * 8;
    const flightShape = 0.72 + Math.random() * 0.55;
    const spin = (Math.random() < 0.5 ? -1 : 1) * (520 + Math.random() * 650);
    const sway = (Math.random() < 0.5 ? -1 : 1) * (9 + Math.random() * 19);
    const trajectory = Object.fromEntries(FLIGHT_STEPS.flatMap((step) => {
      const progress = step / 100;
      const flightProgress = progress + 0.15 * Math.sin(Math.PI * progress);
      const hoverProgress = Math.max(0, (progress - 0.25) / 0.75);
      const hoverDrift = direction * hoverSpread * Math.sin(Math.PI * hoverProgress) ** 2;
      const fallProgress = Math.max(0, (progress - 0.5) / 0.5);
      const fallDrift = fallSpread * fallProgress * fallProgress * (3 - 2 * fallProgress);
      const verticalProgress = flightProgress ** flightShape;
      const horizontal = direction * (edgeTravel * flightProgress + curve * flightProgress * (1 - flightProgress));
      const vertical = -4 * rise * verticalProgress * (1 - verticalProgress) + fall * flightProgress;
      const x = screenLength(FLIGHT_REACH * (0.855 * (horizontal * 50 + direction * overshoot * flightProgress) + hoverDrift) + fallDrift, -FLIGHT_REACH * 0.855 * horizontal * 50);
      const y = screenLength(FLIGHT_REACH * vertical * 50, -FLIGHT_REACH * vertical * 50, FLIGHT_REACH * (-160 * verticalProgress * (1 - verticalProgress) + 30 * flightProgress));
      return [
        [`--x-${step}`, x],
        [`--y-${step}`, y],
        [`--r-${step}`, `${(spin * progress).toFixed(1)}deg`],
      ];
    }));
    return {
      side,
      style: {
        ...trajectory,
        "--start-y": `${25 + Math.random() * 60}%`,
        "--delay": `${(Math.random() * 0.25).toFixed(2)}s`,
        "--flight-duration": `${(2.2 + Math.random()).toFixed(2)}s`,
        "--size": `${(7 + Math.random() * 8).toFixed(1)}px`,
        "--color": CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        "--sway-a": `${sway.toFixed(1)}px`,
        "--sway-b": `${(-sway * 0.85).toFixed(1)}px`,
      } as CSSProperties,
    };
  });
}

function ConfettiBurst() {
  const [pieces] = useState(createConfettiPieces);
  return <div className={styles.confettiLayer} data-testid="confetti-burst" aria-hidden="true">
    {pieces.map((piece, index) => <span key={index} className={styles.confettiPiece} data-side={piece.side} style={piece.style}>
      <span className={styles.confettiShape} />
    </span>)}
  </div>;
}

export function ResultDialog({ result, onClose }: { result: WheelResult | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (result && dialog && !dialog.open) {
      dialog.showModal();
      closeRef.current?.focus({ preventScroll: true });
    }
    if (!result && dialog?.open) dialog.close();
  }, [result]);

  const close = () => {
    dialogRef.current?.close();
    onClose();
  };

  return <dialog
    ref={dialogRef}
    className={styles.dialog}
    aria-labelledby="result-heading"
    aria-describedby="result-description"
    onCancel={(event) => { event.preventDefault(); close(); }}
    onClose={onClose}
  >
    {result && <>
      <ConfettiBurst />
      <div className={styles.dialogContent}>
        <div className={styles.imagePlaceholder} data-testid="result-image-placeholder">
          <span className={styles.imagePlaceholderNote}>BILD FOLGT</span>
          <span className={styles.prizeBadge}>
            <span className={styles.badgeIcon} data-kind={result.id}><PrizeIcon kind={result.id} /></span>
            <span>{result.label}</span>
          </span>
        </div>
        <h2 id="result-heading">{result.headline}</h2>
        <p id="result-description" className={styles.resultDescription}>{result.description}</p>
        <button ref={closeRef} type="button" className={styles.closeButton} onClick={close}>Schließen & weiterdrehen <span aria-hidden="true">↗</span></button>
      </div>
    </>}
  </dialog>;
}
