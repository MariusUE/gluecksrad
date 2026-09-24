import { useRef, type RefObject } from "react";
import { WHEEL_CONFIG } from "../config/wheel";
import { centerAngle, segmentPath } from "../animation/geometry";
import type { GamePhase } from "../domain/types";
import { PrizeIcon } from "./PrizeIcon";
import styles from "./game.module.css";

interface Props {
  phase: GamePhase;
  target: number | null;
  svgRef: RefObject<SVGSVGElement | null>;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onActivate: () => void;
}

export function Wheel({ phase, target, svgRef, buttonRef, onActivate }: Props) {
  const ignoredPointers = useRef(new Set<number>());
  const blocked = phase !== "IDLE" && phase !== "SPINNING";
  const active = phase === "STARTING" || phase === "SPINNING";
  const hint = phase === "IDLE" ? "Zum Drehen drücken"
    : phase === "SPINNING" ? "Zum Stoppen drücken"
      : phase === "STARTING" ? "Es geht los …"
        : phase === "DECELERATING" ? "Dein Glück kommt näher …" : "Dein Ergebnis steht fest";

  return <div className={styles.wheelArea}>
    <div className={styles.pointer} aria-hidden="true"><span /></div>
    <button
      ref={buttonRef}
      type="button"
      className={styles.wheelButton}
      onClick={(event) => {
        const native = event.nativeEvent;
        if ("pointerId" in native && ignoredPointers.current.delete(native.pointerId as number)) return;
        onActivate();
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && (event.repeat || blocked)) event.preventDefault();
      }}
      onPointerDown={(event) => {
        ignoredPointers.current.delete(event.pointerId);
        if (!event.isPrimary || blocked) {
          ignoredPointers.current.add(event.pointerId);
          event.preventDefault();
        }
      }}
      onPointerCancel={(event) => { ignoredPointers.current.delete(event.pointerId); }}
      aria-label={hint}
      aria-describedby="wheel-instructions"
      aria-disabled={blocked}
      data-phase={phase}
    >
      <svg ref={svgRef} className={styles.wheelSvg} viewBox="0 0 600 600" aria-hidden="true" data-testid="wheel-disc">
        <circle cx="300" cy="300" r="298" fill="#FFFFFF" />
        {WHEEL_CONFIG.segments.map((segment, index) => <g key={segment.id} data-segment={index}>
          <path
            d={segmentPath(index)}
            fill={segment.fill}
            stroke="#FFFFFF"
            strokeWidth="2"
            data-selected={phase === "RESULT" && target === index}
            className={styles.segment}
          />
          <g transform={`rotate(${centerAngle(index)} 300 300)`} color={segment.foreground}>
            <g transform="translate(260 70)"><PrizeIcon kind={segment.resultId} className={styles.segmentIcon} /></g>
          </g>
          {phase === "RESULT" && target === index && <path d={segmentPath(index, 280)} className={styles.winnerOutline} />}
        </g>)}
      </svg>
      <span className={styles.hub} aria-hidden="true">
        <span className={styles.hubArrow}>{active ? "Ⅱ" : phase === "DECELERATING" ? "· · ·" : "↻"}</span>
        <span>{active ? "STOPP" : phase === "DECELERATING" ? "GLÜCK" : "DREHEN"}</span>
      </span>
    </button>
  </div>;
}
