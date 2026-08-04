import { describe, expect, it } from "vitest";

import {
  getFindingEvidenceInspectHref,
  getFindingEvidenceTraceHref,
} from "@/lib/finding-evidence-navigation";

describe("finding-evidence-navigation", () => {
  it("builds the canonical evidence-trace route for a finding", () => {
    expect(getFindingEvidenceTraceHref("run-1", "finding-9")).toBe(
      "/architecture/reviews/run-1/findings/finding-9/evidence-trace",
    );
  });

  it("aliases legacy inspect href helper to evidence-trace", () => {
    expect(getFindingEvidenceInspectHref("run-1", "finding-9")).toBe(
      "/architecture/reviews/run-1/findings/finding-9/evidence-trace",
    );
  });
});
