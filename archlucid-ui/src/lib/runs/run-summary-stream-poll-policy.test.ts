import { describe, expect, it } from "vitest";

import { shouldRunRunSummaryFallbackPoll } from "@/lib/runs/run-summary-stream-poll-policy";

describe("run-summary-stream poll policy (TB-2029)", () => {
  it("disables HTTP fallback while SSE is connected", () => {
    expect(
      shouldRunRunSummaryFallbackPoll({
        sseConnected: true,
        documentHidden: false,
        streamPhase: "streaming",
      }),
    ).toBe(false);
  });

  it("enables HTTP fallback only in poll-fallback while tab is visible", () => {
    expect(
      shouldRunRunSummaryFallbackPoll({
        sseConnected: false,
        documentHidden: false,
        streamPhase: "poll-fallback",
      }),
    ).toBe(true);
  });

  it("pauses HTTP fallback when the tab is hidden", () => {
    expect(
      shouldRunRunSummaryFallbackPoll({
        sseConnected: false,
        documentHidden: true,
        streamPhase: "poll-fallback",
      }),
    ).toBe(false);
    });

  it("does not run HTTP fallback after the stream completes", () => {
    expect(
      shouldRunRunSummaryFallbackPoll({
        sseConnected: false,
        documentHidden: false,
        streamPhase: "complete",
      }),
    ).toBe(false);
  });
});
