import type { AnimationFactory } from "../domain/types";
import { crossingNumber, normalizeAngle, SPEED, START_DURATION, targetRotation } from "./geometry";

/** All motion and audio sampling use the same WAAPI clock, including tab pauses. */
export const createWheelAnimation: AnimationFactory = (options) => {
  const { element, reducedMotion, onReady, onFinish, onError, onCrossing } = options;
  let animation: Animation | null = null;
  let canceled = false;
  let paused = document.hidden;
  let phase: "starting" | "spinning" | "stopping" = "starting";
  let base = normalizeAngle(Number(element.dataset.rotation ?? 0));
  let distance = reducedMotion ? 0 : SPEED * START_DURATION / 2000;
  let duration = START_DURATION;
  let frame = 0;
  let lastCrossing = crossingNumber(base);

  const commit = (angle: number) => {
    element.style.transform = `rotate(${angle}deg)`;
    element.dataset.rotation = String(normalizeAngle(angle));
  };

  const angleNow = () => {
    const time = Number(animation?.currentTime ?? 0);
    if (!Number.isFinite(time)) throw new Error("Ungültige Animationszeit.");
    const t = Math.min(1, Math.max(0, time / duration));
    if (phase === "spinning") return base + (reducedMotion ? 0 : time * SPEED / 1000);
    if (phase === "starting") return base + distance * t * t;
    return base + distance * (2 * t - t * t);
  };

  const cancel = () => {
    if (canceled) return;
    canceled = true;
    cancelAnimationFrame(frame);
    // Preserve the displayed orientation even after failure/unmount.
    try { commit(angleNow()); } catch { commit(base); }
    animation?.cancel();
  };

  const fail = () => {
    if (canceled) return;
    cancel();
    onError();
  };

  const sample = () => {
    if (canceled || paused) return;
    try {
      const crossing = crossingNumber(angleNow());
      // At most one click per frame; never replay missed clicks after a stall.
      if (crossing !== lastCrossing && !reducedMotion) onCrossing();
      lastCrossing = crossing;
      frame = requestAnimationFrame(sample);
    } catch { fail(); }
  };

  const play = (frames: Keyframe[], timing: KeyframeAnimationOptions, done?: () => void) => {
    const previous = animation;
    animation = element.animate(frames, timing);
    const current = animation;
    if (paused) current.pause();
    // Install a handler before intentionally canceling an older animation.
    current.finished.then(() => {
      if (!canceled && animation === current) done?.();
    }).catch(() => {
      if (!canceled && animation === current) fail();
    });
    previous?.cancel();
  };

  play([
    { transform: `rotate(${base}deg)` },
    { transform: `rotate(${base + distance}deg)` },
  ], {
    duration, easing: "cubic-bezier(0.3333333333, 0, 0.6666666667, 0.3333333333)", fill: "forwards",
  }, () => {
    base += distance;
    commit(base);
    phase = "spinning";
    play([
      { transform: `rotate(${base}deg)` },
      { transform: `rotate(${base + (reducedMotion ? 0 : 360)}deg)` },
    ], { duration: 1000, iterations: Infinity, easing: "linear" });
    onReady();
  });
  if (!paused) frame = requestAnimationFrame(sample);

  return {
    stop(targetIndex) {
      if (canceled || phase !== "spinning") return;
      try {
        const current = angleNow();
        const target = targetRotation(current, targetIndex, reducedMotion ? 0 : 2);
        base = reducedMotion ? target : current;
        distance = reducedMotion ? 0 : target - current;
        // Quadratic deceleration: initial velocity exactly matches the coast.
        duration = reducedMotion ? 180 : 2 * distance / SPEED * 1000;
        phase = "stopping";
        commit(base);
        play([
          { transform: `rotate(${base}deg)`, opacity: reducedMotion ? 0.65 : 1 },
          { transform: `rotate(${target}deg)`, opacity: 1 },
        ], {
          duration, easing: "cubic-bezier(0.3333333333, 0.6666666667, 0.6666666667, 1)", fill: "forwards",
        }, () => {
          commit(normalizeAngle(target));
          canceled = true;
          cancelAnimationFrame(frame);
          animation?.cancel();
          onFinish();
        });
      } catch { fail(); }
    },
    pause() {
      if (canceled || paused) return;
      paused = true;
      cancelAnimationFrame(frame);
      try {
        if (animation) {
          const time = animation.currentTime;
          animation.pause();
          // WAAPI pause is otherwise pending until the next frame. Hold this frame exactly.
          if (time !== null) animation.currentTime = time;
        }
      } catch { fail(); }
    },
    resume() {
      if (canceled || !paused) return;
      paused = false;
      try {
        animation?.play();
        lastCrossing = crossingNumber(angleNow());
        frame = requestAnimationFrame(sample);
      } catch { fail(); }
    },
    cancel,
  };
};
