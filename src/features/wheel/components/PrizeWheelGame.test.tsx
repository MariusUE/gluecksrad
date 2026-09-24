import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PrizeWheelGame } from "./PrizeWheelGame";
import type { AnimationFactory, AnimationOptions } from "../domain/types";
import { RESULTS } from "../config/wheel";

function setup(index = 2) {
  let callbacks!: AnimationOptions;
  const controls = { stop: vi.fn(), pause: vi.fn(), resume: vi.fn(), cancel: vi.fn() };
  const animate = vi.fn<AnimationFactory>((options) => { callbacks = options; return controls; });
  const random = vi.fn(() => index * 2 ** 29);
  const view = render(<PrizeWheelGame random={random} animate={animate} />);
  const wheel = () => screen.getByRole("button", { name: /drücken|Es geht los|Glück kommt|Ergebnis steht/ });
  return { ...view, controls, random, animate, wheel, callbacks: () => callbacks };
}

describe("game interaction", () => {
  it("selects once, guards the start, stops only on a second activation, then allows repetition", () => {
    const game = setup();
    fireEvent.click(game.wheel());
    fireEvent.click(game.wheel());
    expect(game.random).toHaveBeenCalledTimes(1);
    expect(game.wheel()).toHaveAttribute("data-phase", "STARTING");
    expect(game.controls.stop).not.toHaveBeenCalled();
    act(() => game.callbacks().onReady());
    expect(game.wheel()).toHaveAccessibleName("Zum Stoppen drücken");
    fireEvent.click(game.wheel());
    fireEvent.click(game.wheel());
    expect(game.controls.stop).toHaveBeenCalledExactlyOnceWith(2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => game.callbacks().onFinish());
    expect(screen.getByRole("dialog")).toBeVisible();
    const placeholder = screen.getByTestId("result-image-placeholder");
    expect(placeholder).toContainElement(screen.getByText(RESULTS.mainPrize.label));
    expect(placeholder.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByTestId("confetti-burst").children).toHaveLength(40);
    expect(placeholder.compareDocumentPosition(screen.getByRole("heading", { level: 2 }))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByText(RESULTS.mainPrize.description)).toBeVisible();
    const close = screen.getByRole("button", { name: /Schließen/ });
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(game.wheel()).toHaveFocus();
    expect(game.wheel()).toHaveAttribute("data-phase", "IDLE");
    fireEvent.click(game.wheel());
    expect(game.random).toHaveBeenCalledTimes(2);
  });

  it.each([[0, "coffee"], [1, "wine"], [2, "mainPrize"], [3, "noPrize"]] as const)("shows the canonical description for %i", (index, kind) => {
    const game = setup(index);
    fireEvent.click(game.wheel());
    act(() => game.callbacks().onReady());
    fireEvent.click(game.wheel());
    act(() => game.callbacks().onFinish());
    expect(screen.getByText(RESULTS[kind].description)).toBeVisible();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(game.wheel()).toHaveAttribute("data-phase", "IDLE");
  });

  it("rejects stale callbacks from a previous round", () => {
    const game = setup();
    fireEvent.click(game.wheel());
    const previous = game.callbacks();
    act(() => previous.onReady());
    fireEvent.click(game.wheel());
    act(() => previous.onFinish());
    fireEvent.click(screen.getByRole("button", { name: /Schließen/ }));
    fireEvent.click(game.wheel());
    act(() => { previous.onReady(); previous.onFinish(); previous.onError(); });
    expect(game.wheel()).toHaveAttribute("data-phase", "STARTING");
  });

  it("recovers after animation and randomness failures", () => {
    const game = setup();
    fireEvent.click(game.wheel());
    act(() => game.callbacks().onError());
    expect(screen.getByRole("alert")).toBeVisible();
    expect(game.wheel()).toHaveAttribute("data-phase", "IDLE");
    game.random.mockImplementationOnce(() => { throw new Error("unavailable"); });
    fireEvent.click(game.wheel());
    expect(game.wheel()).toHaveAttribute("data-phase", "IDLE");
    fireEvent.click(game.wheel());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(game.wheel()).toHaveAttribute("data-phase", "STARTING");
  });

  it("pauses/resumes on visibility changes and cancels on unmount", () => {
    const game = setup();
    fireEvent.click(game.wheel());
    const visibility = vi.spyOn(document, "hidden", "get");
    visibility.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(game.controls.pause).toHaveBeenCalledTimes(1);
    visibility.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    expect(game.controls.resume).toHaveBeenCalledTimes(1);
    game.unmount();
    expect(game.controls.cancel).toHaveBeenCalledTimes(1);
  });

  it("passes reduced-motion preference to animation", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const game = setup();
    fireEvent.click(game.wheel());
    expect(game.callbacks().reducedMotion).toBe(true);
  });
});
