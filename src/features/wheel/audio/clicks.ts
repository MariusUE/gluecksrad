export interface ClickAudio {
  unlock(): void;
  setEnabled(enabled: boolean): void;
  setHidden(hidden: boolean): void;
  click(): void;
  dispose(): void;
}

/** Optional, quiet synthesized clicks. No media files, requests, or thrown errors. */
export function createClickAudio(): ClickAudio {
  let context: AudioContext | null = null;
  let enabled = true;
  let hidden = false;
  let disposed = false;
  let lastClick = -Infinity;
  const resume = () => {
    if (!disposed && enabled && !hidden && context?.state === "suspended") {
      void context.resume().catch(() => {});
    }
  };
  return {
    unlock() {
      if (disposed || !enabled || hidden) return;
      try {
        context ??= new AudioContext();
        resume();
      } catch { /* Audio is optional. */ }
    },
    setEnabled(value) {
      enabled = value;
      if (!enabled) void context?.suspend().catch(() => {});
      else resume();
    },
    setHidden(value) {
      hidden = value;
      if (hidden) void context?.suspend().catch(() => {});
      else resume();
    },
    click() {
      if (disposed || !enabled || hidden || !context || context.state !== "running") return;
      try {
        const now = context.currentTime;
        if (now - lastClick < 0.035) return;
        lastClick = now;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(900, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.025);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now);
        oscillator.stop(now + 0.035);
      } catch { /* A failed sound never interrupts a round. */ }
    },
    dispose() {
      disposed = true;
      void context?.close().catch(() => {});
      context = null;
    },
  };
}
