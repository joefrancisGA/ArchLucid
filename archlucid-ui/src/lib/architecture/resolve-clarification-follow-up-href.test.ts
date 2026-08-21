import { describe, expect, it } from "vitest";

import { resolveClarificationFollowUpHref } from "@/lib/architecture/resolve-clarification-follow-up-href";

describe("resolveClarificationFollowUpHref", () => {
  it("keeps correction href when another clarification round is available", () => {
    expect(
      resolveClarificationFollowUpHref({
        runId: "run-2",
        correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-2",
        clarificationRoundAvailable: true,
        priorRunId: null,
      }),
    ).toBe("/architecture/reviews/new?path=guided-intake&rerun=run-2");
  });

  it("routes to compare when clarification round is exhausted and prior run exists", () => {
    const href = resolveClarificationFollowUpHref({
      runId: "run-2",
      correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-2",
      clarificationRoundAvailable: false,
      priorRunId: "run-1",
    });

    expect(href).toContain("run-1");
    expect(href).toContain("run-2");
  });
});
