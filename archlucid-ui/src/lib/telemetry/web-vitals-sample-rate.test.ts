import { describe, expect, it } from "vitest";

import {
  DEFAULT_WEB_VITALS_SAMPLE_RATE,
  resolveWebVitalsSampleRate,
} from "@/lib/telemetry/web-vitals-sample-rate";

describe("resolveWebVitalsSampleRate", () => {
  it("defaults to pilot+ throttle when unset", () => {
    expect(resolveWebVitalsSampleRate(undefined)).toBe(DEFAULT_WEB_VITALS_SAMPLE_RATE);
    expect(resolveWebVitalsSampleRate("")).toBe(DEFAULT_WEB_VITALS_SAMPLE_RATE);
    expect(resolveWebVitalsSampleRate("  ")).toBe(DEFAULT_WEB_VITALS_SAMPLE_RATE);
  });

  it("clamps to 0..1 and rejects non-finite", () => {
    expect(resolveWebVitalsSampleRate("-1")).toBe(0);
    expect(resolveWebVitalsSampleRate("0")).toBe(0);
    expect(resolveWebVitalsSampleRate("0.5")).toBe(0.5);
    expect(resolveWebVitalsSampleRate("1")).toBe(1);
    expect(resolveWebVitalsSampleRate("2")).toBe(1);
    expect(resolveWebVitalsSampleRate("nope")).toBe(DEFAULT_WEB_VITALS_SAMPLE_RATE);
  });
});
