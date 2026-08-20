import { describe, expect, it } from "vitest";

import { resolveClarificationsFindingsLoopNext } from "@/lib/review-clarifications-findings-loop";

describe("resolveClarificationsFindingsLoopNext (TB-2367)", () => {
  it("routes open clarifications to the clarifications tab first", () => {
    const next = resolveClarificationsFindingsLoopNext({
      openClarificationGapCount: 2,
      findingsCount: 5,
    });

    expect(next?.nextTabId).toBe("decisions-remediation");
    expect(next?.sentence).toContain("2 clarifying questions");
    expect(next?.sentence).toContain("before triaging findings");
  });

  it("routes to findings when clarifications are clear", () => {
    const next = resolveClarificationsFindingsLoopNext({
      openClarificationGapCount: 0,
      findingsCount: 3,
    });

    expect(next?.nextTabId).toBe("findings");
    expect(next?.sentence).toContain("Clarifications are clear");
    expect(next?.sentence).toContain("3 assessment findings");
  });

  it("returns null when both queues are empty", () => {
    expect(
      resolveClarificationsFindingsLoopNext({
        openClarificationGapCount: 0,
        findingsCount: 0,
      }),
    ).toBeNull();
  });
});
