import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import { buildCompareFindingLifecycleInspectHref } from "@/lib/compare-finding-lifecycle-inspect-href";
import type { CompareFindingLifecycleRecord } from "@/lib/compare-finding-lifecycle";

function record(overrides: Partial<CompareFindingLifecycleRecord> = {}): CompareFindingLifecycleRecord {
  return {
    state: "PreviouslyIdentifiedStillPresent",
    resolutionBasis: "NotApplicable",
    category: "Security",
    message: "Private endpoint",
    severity: "High",
    priorFindingId: "finding-prior",
    currentFindingId: "finding-current",
    correlationMethod: "id",
    sourceAgent: "policy",
    latestDisposition: null,
    ...overrides,
  };
}

describe("buildCompareFindingLifecycleInspectHref (WA-002)", () => {
  it("lands on nested focusedFinding when Working architecture is known", () => {
    const href = buildCompareFindingLifecycleInspectHref({
      record: record(),
      priorRunId: "run-prior",
      laterRunId: "run-later",
      inspectHrefOptions: { architectureId: "arch-1", isWorkingMode: true },
    });

    expect(href).toBe(
      `${architectureNestedFindingsPath("arch-1")}?runId=run-later&focusedFinding=finding-current&priorRunId=run-prior`,
    );
  });

  it("keeps peer finding detail when architecture is unknown", () => {
    const href = buildCompareFindingLifecycleInspectHref({
      record: record({ currentFindingId: null }),
      priorRunId: "run-prior",
      laterRunId: "run-later",
    });

    expect(href).toBe("/architecture/reviews/run-prior/findings/finding-prior?laterRunId=run-later");
  });
});
