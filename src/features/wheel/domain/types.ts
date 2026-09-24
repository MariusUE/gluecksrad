export type ResultId = "coffee" | "wine" | "mainPrize" | "noPrize";

export interface WheelResult {
  readonly id: ResultId;
  readonly label: string;
  readonly headline: string;
  readonly description: string;
}

export interface WheelSegment {
  readonly id: string;
  readonly resultId: ResultId;
  readonly fill: string;
  readonly foreground: string;
}

export interface WheelConfig {
  readonly results: Readonly<Record<ResultId, WheelResult>>;
  readonly segments: readonly WheelSegment[];
}

export type GamePhase = "IDLE" | "STARTING" | "SPINNING" | "DECELERATING" | "RESULT" | "RESET";

/** A uniformly distributed unsigned 32-bit integer. */
export type RandomSource = () => number;

export interface AnimationController {
  stop(targetIndex: number): void;
  pause(): void;
  resume(): void;
  cancel(): void;
}

export interface AnimationOptions {
  readonly element: SVGSVGElement;
  readonly reducedMotion: boolean;
  readonly onReady: () => void;
  readonly onFinish: () => void;
  readonly onError: () => void;
  readonly onCrossing: () => void;
}

export type AnimationFactory = (options: AnimationOptions) => AnimationController;
