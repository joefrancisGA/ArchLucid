import { describe, expect, it } from "vitest";

import { resolveShellAiReadinessRecoverySteps } from "@/lib/resolve-shell-ai-readiness-recovery-steps";
import type { SessionAiReadinessState } from "@/hooks/use-session-ai-readiness-core";

function baseState(overrides: Partial<SessionAiReadinessState>): SessionAiReadinessState {
  return {
    sessionMode: "Real",
    hostMode: "Real",
    hasDevOverride: false,
    isSessionReal: true,
    isLoading: false,
    isReady: false,
    blocksExecute: true,
    detail: null,
    availability: null,
    probeState: { status: "idle" },
    checkAvailability: async () => {},
    ...overrides,
  };
}

describe("resolveShellAiReadinessRecoverySteps", () => {
  it("returns no steps when live AI is ready", () => {
    expect(
      resolveShellAiReadinessRecoverySteps(
        baseState({ isReady: true, probeState: { status: "loaded", result: {
          isAvailable: true,
          validated: true,
          aiSource: "managed-platform",
          summary: "ok",
          asOfUtc: "2026-01-01T00:00:00Z",
          checks: [],
          debug: {},
        } } }),
      ),
    ).toEqual([]);
  });

  it("returns pending steps while the probe is loading", () => {
    const steps = resolveShellAiReadinessRecoverySteps(
      baseState({ probeState: { status: "loading" } }),
    );

    expect(steps.join(" ")).toContain("Checking live AI availability");
  });

  it("returns retry guidance when the probe errors", () => {
    const steps = resolveShellAiReadinessRecoverySteps(
      baseState({
        probeState: { status: "error", message: "AI availability check timed out after 20s." },
      }),
    );

    expect(steps.join(" ")).toContain("Check AI availability");
  });
});
