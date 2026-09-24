"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createWheelAnimation } from "./animation/controller";
import { createClickAudio, type ClickAudio } from "./audio/clicks";
import { INITIAL_STATE, transition, type GameEvent, type GameState } from "./domain/machine";
import type { AnimationController, AnimationFactory, RandomSource } from "./domain/types";
import { cryptoRandom, selectSegment } from "./selection/uniform";

interface Dependencies {
  random?: RandomSource;
  animate?: AnimationFactory;
}

export function useWheelGame({ random = cryptoRandom, animate = createWheelAnimation }: Dependencies = {}) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const stateRef = useRef(state);
  const svgRef = useRef<SVGSVGElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const controller = useRef<AnimationController | null>(null);
  const audio = useRef<ClickAudio | null>(null);
  const operation = useRef(0);
  const selecting = useRef(false);

  const send = useCallback((event: GameEvent) => {
    const next = transition(stateRef.current, event);
    stateRef.current = next; // Synchronous gate, before React commits a render.
    setState(next);
  }, []);

  useEffect(() => {
    const clicks = createClickAudio();
    audio.current = clicks;
    const visibility = () => {
      clicks.setHidden(document.hidden);
      if (document.hidden) controller.current?.pause();
      else controller.current?.resume();
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      operation.current += 1;
      controller.current?.cancel();
      controller.current = null;
      document.removeEventListener("visibilitychange", visibility);
      clicks.dispose();
      audio.current = null;
    };
  }, []);

  const activate = () => {
    if (document.hidden) return;
    if (stateRef.current.phase === "SPINNING") {
      send({ type: "STOP" });
      controller.current?.stop(stateRef.current.target!);
      return;
    }
    if (selecting.current || stateRef.current.phase !== "IDLE" || !svgRef.current) return;
    selecting.current = true;
    const id = ++operation.current;
    const fail = () => {
      if (operation.current !== id) return;
      operation.current += 1;
      controller.current?.cancel();
      controller.current = null;
      send({ type: "FAIL", message: "Das Rad konnte nicht weiterdrehen. Bitte drücke es noch einmal." });
    };
    try {
      const target = selectSegment(random);
      send({ type: "START", target });
      audio.current?.unlock();
      controller.current = animate({
        element: svgRef.current,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        onReady: () => { if (operation.current === id) send({ type: "READY" }); },
        onFinish: () => { if (operation.current === id) send({ type: "FINISH" }); },
        onError: fail,
        onCrossing: () => audio.current?.click(),
      });
    } catch { fail(); }
    finally { selecting.current = false; }
  };

  const reset = useCallback(() => {
    if (stateRef.current.phase !== "RESULT") return;
    operation.current += 1;
    controller.current?.cancel();
    controller.current = null;
    send({ type: "CLOSE" });
    send({ type: "RESET" });
    buttonRef.current?.focus({ preventScroll: true });
  }, [send]);

  return { state, svgRef, buttonRef, activate, reset };
}
