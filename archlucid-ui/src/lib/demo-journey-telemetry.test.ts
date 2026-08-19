import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emitDemoJourneyTelemetry } from "@/lib/demo-journey-telemetry";

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoPackEnv: () => true,
}));

describe("emitDemoJourneyTelemetry", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (window as Window & { clarity?: unknown }).clarity;
  });

  it("does not throw when window.clarity is undefined", () => {
    expect(() => {
      emitDemoJourneyTelemetry({ kind: "step_entered", stepIndex: 0, stepLabel: "Sponsor report" });
    }).not.toThrow();
  });

  it("calls window.clarity when present", () => {
    const clarity = vi.fn();
    (window as Window & { clarity?: typeof clarity }).clarity = clarity;

    emitDemoJourneyTelemetry({ kind: "step_entered", stepIndex: 2, stepLabel: "Evidence graph" });

    expect(clarity).toHaveBeenCalledWith("event", "demo_step_entered");
  });

  it("does not throw when window.clarity is not a function", () => {
    (window as Window & { clarity?: unknown }).clarity = "not-a-function" as unknown as (
      command: string,
      eventName: string,
    ) => void;

    expect(() => {
      emitDemoJourneyTelemetry({ kind: "tour_ended", stepsVisitedCount: 5 });
    }).not.toThrow();
  });
});
