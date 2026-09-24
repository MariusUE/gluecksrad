import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { RESULTS, WHEEL_CONFIG } from "../src/features/wheel/config/wheel";

async function fixedDraw(page: Page, indices: number[]) {
  // Browser API substitution lives entirely in tests. The production app has no override.
  await page.addInitScript((values) => {
    const original = crypto.getRandomValues.bind(crypto);
    let call = 0;
    Object.defineProperty(crypto, "getRandomValues", { value: (array: Uint32Array) => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = values[call++ % values.length]! * 2 ** 29;
        return array;
      }
      return original(array);
    } });
  }, indices);
}

const wheel = (page: Page) => page.locator("button[data-phase]");

async function startAndStop(page: Page) {
  await wheel(page).click();
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  await wheel(page).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function assertAlignment(page: Page, index: number) {
  const alignment = await page.getByTestId("wheel-disc").evaluate((element, target) => {
    const svg = element as unknown as SVGSVGElement;
    const matrix = svg.getScreenCTM()!;
    const angle = target * Math.PI / 4;
    const point = new DOMPoint(300 + Math.sin(angle) * 220, 300 - Math.cos(angle) * 220).matrixTransform(matrix);
    const center = new DOMPoint(300, 300).matrixTransform(matrix);
    return { dx: point.x - center.x, dy: point.y - center.y, transform: getComputedStyle(svg).transform };
  }, index);
  expect(Math.abs(alignment.dx)).toBeLessThan(0.1);
  expect(alignment.dy).toBeLessThan(-100);
  await expect(page.locator(`[data-segment="${index}"] path[data-selected="true"]`)).toHaveCount(1);
  await expect(page.locator('path[data-selected="true"]')).toHaveCount(1);
}

for (let index = 0; index < 8; index++) {
  test(`real animation lands visibly at segment ${index}`, async ({ page }) => {
    await fixedDraw(page, [index]);
    await page.goto("/");
    await wheel(page).click();
    // Programmatic rapid activation bypasses Playwright's aria-disabled auto-wait.
    await wheel(page).evaluate((element) => { (element as HTMLButtonElement).click(); (element as HTMLButtonElement).click(); });
    await expect(wheel(page)).toHaveAttribute("data-phase", "STARTING");
    await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
    await page.waitForTimeout(250 + index * 85);
    const before = await page.getByTestId("wheel-disc").evaluate((element) => getComputedStyle(element).transform);
    await wheel(page).click();
    await expect(wheel(page)).toHaveAttribute("data-phase", "DECELERATING");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await wheel(page).evaluate((element) => (element as HTMLButtonElement).click());
    await expect(wheel(page)).toHaveAttribute("data-phase", "DECELERATING");
    await expect(page.getByRole("dialog")).toBeVisible();
    const resultId = WHEEL_CONFIG.segments[index]!.resultId;
    await expect(page.getByText(RESULTS[resultId].description, { exact: true })).toBeVisible();
    await assertAlignment(page, index);
    expect(before).not.toBe("none");
    await page.getByRole("button", { name: /Schließen/ }).click();
    await expect(wheel(page)).toBeFocused();
    await expect(wheel(page)).toHaveAttribute("data-phase", "IDLE");
  });
}

test("keyboard, repeat protection, focus trap, Escape and next round", async ({ page }) => {
  await fixedDraw(page, [0, 7]);
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(wheel(page)).toBeFocused();
  await page.keyboard.down("Enter");
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  await page.keyboard.down("Enter");
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  await page.keyboard.up("Enter");
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toBeVisible();
  const close = page.getByRole("button", { name: /Schließen/ });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.mouse.click(10, 10);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(wheel(page)).toBeFocused();
  await page.keyboard.press("Space");
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await assertAlignment(page, 7);
});

test("reduced motion stays still until manually stopped", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixedDraw(page, [5]);
  await page.goto("/");
  await wheel(page).click();
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  const before = await page.getByTestId("wheel-disc").evaluate((element) => getComputedStyle(element).transform);
  await page.waitForTimeout(1100);
  const after = await page.getByTestId("wheel-disc").evaluate((element) => getComputedStyle(element).transform);
  expect(after).toBe(before);
  await expect(page.getByRole("status")).toContainText("Zum Stoppen");
  await wheel(page).click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1500 });
  await assertAlignment(page, 5);
});

test("confetti shoots toward the screen edges and sways while falling", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixedDraw(page, [2]);
  await page.goto("/");
  await wheel(page).click();
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await wheel(page).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  const pieces = page.getByTestId("confetti-burst").locator("[data-side]");
  await expect(pieces).toHaveCount(40);
  const paths = await pieces.evaluateAll((elements) => elements.slice(0, 2).map((element) => {
    const animation = element.getAnimations()[0]!;
    const dialog = element.closest("dialog")!.getBoundingClientRect();
    const timing = animation.effect!.getTiming();
    const duration = Number(timing.duration);
    const delay = timing.delay ?? 0;
    animation.pause();
    const position = (progress: number) => {
      animation.currentTime = delay + duration * progress;
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, opacity: Number(getComputedStyle(element).opacity) };
    };
    const shapeAnimation = element.firstElementChild!.getAnimations()[0]!;
    shapeAnimation.pause();
    const sway = (progress: number) => {
      shapeAnimation.currentTime = delay + duration * progress;
      return new DOMMatrix(getComputedStyle(element.firstElementChild!).transform).m41;
    };
    return {
      dialog: { left: dialog.left, right: dialog.right },
      start: position(0), launch: position(0.2), peak: position(0.5), end: position(1), duration, delay,
      swayA: sway(0.58), swayB: sway(0.69),
    };
  }));
  expect(Math.abs(paths[0]!.start.x - paths[0]!.dialog.left)).toBeLessThan(10);
  expect(Math.abs(paths[1]!.start.x + paths[1]!.start.width - paths[1]!.dialog.right)).toBeLessThan(10);
  expect(paths[0]!.peak.x).toBeLessThan(paths[0]!.start.x);
  expect(paths[1]!.peak.x).toBeGreaterThan(paths[1]!.start.x);
  expect(paths[0]!.end.x).toBeGreaterThan(0);
  expect(paths[0]!.end.x).toBeLessThan(350);
  expect(paths[1]!.end.x).toBeGreaterThan(1570);
  expect(paths[1]!.end.x).toBeLessThan(1920);
  for (const path of paths) {
    expect(Math.abs(path.launch.x - path.start.x)).toBeGreaterThan(85);
    expect(path.peak.y).toBeLessThan(path.start.y);
    expect(Math.abs(path.peak.y - path.start.y)).toBeLessThan(Math.abs(path.peak.x - path.start.x));
    expect(path.end.y).toBeGreaterThan(path.peak.y);
    expect(path.end.opacity).toBe(0);
    expect(path.duration).toBeGreaterThanOrEqual(2200);
    expect(path.duration + path.delay).toBeLessThanOrEqual(3500);
    expect(path.swayA * path.swayB).toBeLessThan(0);
  }
  const travelDistances = await pieces.evaluateAll((elements) => new Set(elements.map((element) => (element as HTMLElement).style.getPropertyValue("--x-100"))).size);
  expect(travelDistances).toBeGreaterThan(20);
  await pieces.evaluateAll((elements) => elements.forEach((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      const timing = animation.effect!.getTiming();
      animation.pause();
      animation.currentTime = (timing.delay ?? 0) + Number(timing.duration) * 0.8;
    }
  }));
  await testInfo.attach("confetti", { body: await page.screenshot(), contentType: "image/png" });
});

test("continues indefinitely and resumes precisely after tab visibility changes", async ({ page }) => {
  await fixedDraw(page, [4]);
  await page.goto("/");
  await wheel(page).click();
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  await page.getByTestId("wheel-disc").evaluate((element) => { element.getAnimations()[0]!.currentTime = 120_000; });
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  // Chromium headless does not expose native OS tab hiding; dispatch the same browser signal.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const paused = await page.getByTestId("wheel-disc").evaluate(async (element) => {
    const animation = element.getAnimations()[0]!;
    await animation.ready;
    return { state: animation.playState, transform: getComputedStyle(element).transform };
  });
  expect(paused.state).toBe("paused");
  await page.waitForTimeout(650);
  expect(await page.getByTestId("wheel-disc").evaluate((element) => getComputedStyle(element).transform)).toBe(paused.transform);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const stop = await wheel(page).evaluate((element) => {
    const disc = element.querySelector("svg")!;
    const before = new DOMMatrix(getComputedStyle(disc).transform);
    (element as HTMLButtonElement).click();
    const after = new DOMMatrix(getComputedStyle(disc).transform);
    return {
      jump: Math.hypot(before.a - after.a, before.b - after.b),
      duration: Number(disc.getAnimations()[0]!.effect!.getTiming().duration),
    };
  });
  expect(stop.jump).toBeLessThan(0.001);
  expect(stop.duration).toBeGreaterThanOrEqual(4000);
  expect(stop.duration).toBeLessThan(6000);
  await expect(wheel(page)).toHaveAttribute("data-phase", "DECELERATING");
  // Pause during braking too; no result may be published while hidden.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.waitForTimeout(500);
  await expect(wheel(page)).toHaveAttribute("data-phase", "DECELERATING");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await assertAlignment(page, 4);
});

test("audio follows tab visibility and failures remain playable", async ({ page }) => {
  await page.addInitScript(() => {
    const contexts: AudioContext[] = [];
    const Original = window.AudioContext;
    window.AudioContext = class extends Original { constructor() { super(); contexts.push(this); } };
    Object.assign(window, { testAudioContexts: contexts });
  });
  await page.goto("/");
  await wheel(page).click();
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  const audioState = () => page.evaluate(() => (window as unknown as { testAudioContexts: AudioContext[] }).testAudioContexts[0]?.state);
  await expect.poll(audioState).toBe("running");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(audioState).toBe("suspended");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(audioState).toBe("running");
  await page.getByTestId("wheel-disc").evaluate((element) => element.getAnimations()[0]!.cancel());
  await expect(page.getByRole("alert").filter({ hasText: "Das Rad konnte nicht weiterdrehen" })).toBeVisible();
  await expect(wheel(page)).toHaveAttribute("data-phase", "IDLE");
  await page.evaluate(() => {
    window.AudioContext.prototype.createOscillator = () => { throw new Error("Audio unavailable"); };
  });
  await startAndStop(page);
});

test("several rounds continue offline after load without runtime requests", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixedDraw(page, [0, 1, 2, 3]);
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(wheel(page)).toBeVisible();
  await page.waitForLoadState("networkidle");
  page.on("request", (request) => requests.push(request.url()));
  await context.setOffline(true);
  for (let index = 0; index < 4; index++) {
    await startAndStop(page);
    await assertAlignment(page, index);
    await page.getByRole("button", { name: /Schließen/ }).click();
  }
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});

for (const [width, height] of [[1920, 1080], [1366, 768], [1280, 800], [1024, 768], [390, 844]]) {
  test(`layout and long dialog at ${width}×${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: width!, height: height! });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await fixedDraw(page, [2]);
    await page.goto("/");
    const bounds = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    expect(bounds.width).toBeLessThanOrEqual(width!);
    expect(bounds.height).toBeLessThanOrEqual(height!);
    await expect(wheel(page)).toBeInViewport({ ratio: 1 });
    await testInfo.attach("idle", { body: await page.screenshot(), contentType: "image/png" });
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    await startAndStop(page);
    await expect(page.getByText(RESULTS.mainPrize.description, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Schließen/ })).toBeInViewport({ ratio: 1 });
    await testInfo.attach("main-prize", { body: await page.screenshot(), contentType: "image/png" });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("touch activation and overlapping secondary pointer do not stop a round", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixedDraw(page, [6]);
  await page.goto("/");
  await wheel(page).tap();
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  await wheel(page).evaluate((element) => {
    element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 2, isPrimary: false, pointerType: "touch" }));
    element.dispatchEvent(new PointerEvent("click", { bubbles: true, pointerId: 2, isPrimary: false, pointerType: "touch", detail: 1 }));
  });
  await expect(wheel(page)).toHaveAttribute("data-phase", "SPINNING");
  await wheel(page).tap();
  await expect(page.getByRole("dialog")).toBeVisible();
  await assertAlignment(page, 6);
  await context.close();
});
