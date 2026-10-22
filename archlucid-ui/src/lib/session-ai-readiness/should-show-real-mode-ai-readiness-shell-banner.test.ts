import { describe, expect, it } from "vitest";

import type { WorkspaceAiAvailabilityCheckState } from "@/hooks/useWorkspaceAiAvailabilityCheck";
import type { WorkspaceAiAvailabilityResult } from "@/lib/workspace-ai-availability";
import {
  isLiveAiAvailabilityProbeFailed,
  shouldShowRealModeAiReadinessShellBanner,
} from "@/lib/session-ai-readiness/should-show-real-mode-ai-readiness-shell-banner";

function loadedResult(
  overrides: Partial<WorkspaceAiAvailabilityResult> = {},
): WorkspaceAiAvailabilityResult {
  return {
    isAvailable: true,
    validated: true,
    aiSource: "managed-platform",
    summary: "ok",
    asOfUtc: "2026-01-01T00:00:00Z",
    checks: [],
    debug: {},
    ...overrides,
  };
}

describe("isLiveAiAvailabilityProbeFailed", () => {
  it("is false while the probe has not finished", () => {
    expect(isLiveAiAvailabilityProbeFailed({ status: "idle" })).toBe(false);
    expect(isLiveAiAvailabilityProbeFailed({ status: "loading" })).toBe(false);
  });

  it("is true when the probe errors or reports unavailable", () => {
    expect(
      isLiveAiAvailabilityProbeFailed({ status: "error", message: "timed out" }),
    ).toBe(true);
    expect(
      isLiveAiAvailabilityProbeFailed({
        status: "loaded",
        result: loadedResult({ isAvailable: false }),
      }),
    ).toBe(true);
  });

  it("is false when the probe reports available", () => {
    const state: WorkspaceAiAvailabilityCheckState = {
      status: "loaded",
      result: loadedResult(),
    };

    expect(isLiveAiAvailabilityProbeFailed(state)).toBe(false);
  });
});

describe("shouldShowRealModeAiReadinessShellBanner", () => {
  it("stays hidden during the initial background check", () => {
    expect(
      shouldShowRealModeAiReadinessShellBanner({
        isSessionReal: true,
        isReady: false,
        probeState: { status: "loading" },
        hasAnnouncedFailure: false,
      }),
    ).toBe(false);
  });

  it("shows after a failed probe", () => {
    expect(
      shouldShowRealModeAiReadinessShellBanner({
        isSessionReal: true,
        isReady: false,
        probeState: { status: "error", message: "timed out" },
        hasAnnouncedFailure: false,
      }),
    ).toBe(true);
  });

  it("stays visible during a retry after a failure was already shown", () => {
    expect(
      shouldShowRealModeAiReadinessShellBanner({
        isSessionReal: true,
        isReady: false,
        probeState: { status: "loading" },
        hasAnnouncedFailure: true,
      }),
    ).toBe(true);
  });

  it("hides when live AI is ready or the session is not Real", () => {
    expect(
      shouldShowRealModeAiReadinessShellBanner({
        isSessionReal: true,
        isReady: true,
        probeState: { status: "loaded", result: loadedResult() },
        hasAnnouncedFailure: true,
      }),
    ).toBe(false);
    expect(
      shouldShowRealModeAiReadinessShellBanner({
        isSessionReal: false,
        isReady: false,
        probeState: { status: "error", message: "timed out" },
        hasAnnouncedFailure: false,
      }),
    ).toBe(false);
  });
});
