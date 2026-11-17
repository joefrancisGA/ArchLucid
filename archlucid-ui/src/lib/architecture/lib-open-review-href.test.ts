import { describe, expect, it } from "vitest";

import {
  resolveLibFindingDetailHref,
  resolveLibOpenReviewHref,
  resolveLibReviewProvenanceHref,
  resolveLibReviewWorkspaceHref,
} from "@/lib/architecture/lib-open-review-href";

describe("resolveLibOpenReviewHref", () => {
  it("opens decisions-remediation with explicit architecture id", () => {
    expect(
      resolveLibOpenReviewHref("run-abc", {
        architectureId: "architecture-identity-001",
        tab: "decisions-remediation",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-abc?reviewTab=decisions-remediation",
    );
  });

  it("appends sponsor-handoff hash on desk-aware base", () => {
    expect(
      resolveLibOpenReviewHref("run-abc", {
        architectureId: "architecture-identity-001",
        hash: "sponsor-handoff",
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-abc#sponsor-handoff",
    );
  });
});

describe("resolveLibReviewWorkspaceHref", () => {
  it("opens findings tab with job-view query on nested desk", () => {
    const params = new URLSearchParams({ findingJobView: "coverage-gaps" });

    expect(
      resolveLibReviewWorkspaceHref({
        runId: "run-abc",
        architectureId: "architecture-identity-001",
        reviewTab: "findings",
        search: params,
      }),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-abc?findingJobView=coverage-gaps&reviewTab=findings",
    );
  });
});

describe("resolveLibFindingDetailHref", () => {
  it("uses path finding segment on nested desk", () => {
    expect(resolveLibFindingDetailHref("run-abc", "finding-9", "architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-abc/findings/finding-9",
    );
  });
});

describe("resolveLibReviewProvenanceHref", () => {
  it("opens provenance child route on nested desk", () => {
    expect(resolveLibReviewProvenanceHref("run-abc", "architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-abc/provenance",
    );
  });
});
