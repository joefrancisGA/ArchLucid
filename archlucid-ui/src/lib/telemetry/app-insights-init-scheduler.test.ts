import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { scheduleDeferredAppInsightsInit } from "./app-insights-init-scheduler";

describe("app-insights-init-scheduler (TB-572)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("uses requestIdleCallback when available", () => {
    const onInit = vi.fn();
    const cancelIdleCallback = vi.fn();
    const requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 });
      return 42;
    });

    vi.stubGlobal("window", {
      requestIdleCallback,
      cancelIdleCallback,
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    });

    const dispose = scheduleDeferredAppInsightsInit(onInit);

    expect(requestIdleCallback).toHaveBeenCalledOnce();
    expect(onInit).toHaveBeenCalledOnce();

    dispose();

    expect(cancelIdleCallback).toHaveBeenCalledWith(42);
  });

  it("falls back to setTimeout when requestIdleCallback is unavailable", () => {
    const onInit = vi.fn();

    vi.stubGlobal("window", {
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    });

    scheduleDeferredAppInsightsInit(onInit);

    expect(onInit).not.toHaveBeenCalled();

    vi.runAllTimers();

    expect(onInit).toHaveBeenCalledOnce();
  });

  it("AppInsightsTelemetryInit delegates to the shared scheduler", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "components", "AppInsightsTelemetryInit.tsx"),
      "utf8",
    );

    expect(source).toContain('scheduleDeferredAppInsightsInit');
    expect(source).toContain("@/lib/telemetry/app-insights-init-scheduler");
    expect(source).not.toContain("requestIdleCallback");
  });
});
