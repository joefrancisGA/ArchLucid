import { describe, expect, it } from "vitest";

import {
  DIGEST_COVERAGE_COLUMN_HEADER,
  DIGEST_COVERAGE_COMPARED_LABEL,
  DIGEST_COVERAGE_SNAPSHOT_LABEL,
  DIGEST_COVERAGE_UNSPECIFIED_DETAIL,
  DIGEST_COVERAGE_UNSPECIFIED_LABEL,
  resolveDigestPeriodCoverage,
} from "@/lib/digest-period-coverage";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";

function digest(overrides: Partial<ArchitectureDigest> = {}): ArchitectureDigest {
  return {
    digestId: "d1",
    tenantId: "t",
    workspaceId: "w",
    projectId: "p",
    generatedUtc: "2026-07-08T12:00:00Z",
    title: "Weekly architecture digest",
    summary: "Summary line",
    contentMarkdown: "# Body",
    metadataJson: "{}",
    ...overrides,
  };
}

describe("resolveDigestPeriodCoverage (TB-1503)", () => {
  it("does not label the column Period, because the DTO carries no calendar bounds", () => {
    expect(DIGEST_COVERAGE_COLUMN_HEADER).toBe("Coverage");
  });

  it("shows both short review refs when the digest compares two reviews", () => {
    const coverage = resolveDigestPeriodCoverage(
      digest({ runId: "aaaaaaaa-1111-2222-3333-444444444444", comparedToRunId: "bbbbbbbb-5555-6666-7777-888888888888" }),
    );

    expect(coverage.label).toBe(DIGEST_COVERAGE_COMPARED_LABEL);
    expect(coverage.detail).toBe("bbbbbbbb → aaaaaaaa");
  });

  it("shows the prior review ref when only the compared review is recorded", () => {
    const coverage = resolveDigestPeriodCoverage(digest({ comparedToRunId: "bbbbbbbb-5555" }));

    expect(coverage.label).toBe(DIGEST_COVERAGE_COMPARED_LABEL);
    expect(coverage.detail).toBe("Since review bbbbbbbb");
  });

  it("labels a single-review digest as a snapshot with its ref", () => {
    const coverage = resolveDigestPeriodCoverage(digest({ runId: "aaaaaaaa-1111" }));

    expect(coverage.label).toBe(DIGEST_COVERAGE_SNAPSHOT_LABEL);
    expect(coverage.detail).toBe("Review aaaaaaaa");
  });

  it("keeps short refs intact rather than padding them", () => {
    const coverage = resolveDigestPeriodCoverage(digest({ runId: "abc" }));

    expect(coverage.detail).toBe("Review abc");
  });

  it("states the period is unspecified instead of inventing a window", () => {
    const coverage = resolveDigestPeriodCoverage(digest({ runId: null, comparedToRunId: "   " }));

    expect(coverage.label).toBe(DIGEST_COVERAGE_UNSPECIFIED_LABEL);
    expect(coverage.detail).toBe(DIGEST_COVERAGE_UNSPECIFIED_DETAIL);
  });

  it("never emits the opaque Compared period / Current period labels", () => {
    const labels = [
      resolveDigestPeriodCoverage(digest({ comparedToRunId: "b1" })).label,
      resolveDigestPeriodCoverage(digest({ runId: "a1" })).label,
      resolveDigestPeriodCoverage(digest()).label,
    ];

    expect(labels).not.toContain("Compared period");
    expect(labels).not.toContain("Current period");
  });
});
