import { describe, expect, it } from "vitest";

import { isLiveAiProbeReady } from "@/lib/session-ai-readiness/is-live-ai-probe-ready";
import type { WorkspaceAiAvailabilityResult } from "@/lib/workspace-ai-availability";

function result(overrides: Partial<WorkspaceAiAvailabilityResult>): WorkspaceAiAvailabilityResult {
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

describe("isLiveAiProbeReady", () => {
  it("requires managed-platform or customer-connection when session is Real", () => {
    expect(isLiveAiProbeReady(true, result({ aiSource: "simulator" }))).toBe(false);
    expect(isLiveAiProbeReady(true, result({ aiSource: "managed-platform" }))).toBe(true);
    expect(isLiveAiProbeReady(true, result({ aiSource: "customer-connection" }))).toBe(true);
  });

  it("allows simulator availability when session is not Real", () => {
    expect(isLiveAiProbeReady(false, result({ aiSource: "simulator" }))).toBe(true);
  });

  it("returns false when availability is not marked available", () => {
    expect(isLiveAiProbeReady(true, result({ isAvailable: false }))).toBe(false);
  });
});
