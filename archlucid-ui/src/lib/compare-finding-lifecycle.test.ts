import { describe, expect, it } from "vitest";

import {
  buildCompareFindingLifecycleCountRows,
  buildCompareFindingLifecycleStatusSentence,
  coerceCompareFindingLifecycleRecords,
  coerceCompareFindingLifecycleSummary,
  compareFindingResolutionBasisLabel,
  comparePageHrefWithLifecycleAnchor,
  type CompareFindingLifecycleRecord,
  type CompareFindingLifecycleSummary,
} from "@/lib/compare-finding-lifecycle";

describe("coerceCompareFindingLifecycleSummary", () => {
  it("returns null for absent or non-object payloads", () => {
    expect(coerceCompareFindingLifecycleSummary(null)).toBeNull();
    expect(coerceCompareFindingLifecycleSummary(undefined)).toBeNull();
    expect(coerceCompareFindingLifecycleSummary("summary")).toBeNull();
  });

  it("returns null when the honesty note is missing", () => {
    expect(coerceCompareFindingLifecycleSummary({ newlyIdentifiedCount: 3 })).toBeNull();
  });

  it("reads every count from the wire payload", () => {
    const summary = coerceCompareFindingLifecycleSummary({
      newlyIdentifiedCount: 1,
      previouslyIdentifiedStillPresentCount: 2,
      confirmedResolvedCount: 3,
      unverifiedResolvedCount: 4,
      absenceNotInformativeCount: 5,
      honestyNote: "  Qualifier.  ",
    });

    expect(summary).toEqual({
      newlyIdentifiedCount: 1,
      previouslyIdentifiedStillPresentCount: 2,
      confirmedResolvedCount: 3,
      unverifiedResolvedCount: 4,
      absenceNotInformativeCount: 5,
      honestyNote: "Qualifier.",
    });
  });

  it("clamps malformed counts to zero rather than rendering NaN", () => {
    const summary = coerceCompareFindingLifecycleSummary({
      newlyIdentifiedCount: -4,
      confirmedResolvedCount: "many",
      unverifiedResolvedCount: Number.NaN,
      honestyNote: "Qualifier.",
    });

    expect(summary?.newlyIdentifiedCount).toBe(0);
    expect(summary?.confirmedResolvedCount).toBe(0);
    expect(summary?.unverifiedResolvedCount).toBe(0);
  });
});

describe("buildCompareFindingLifecycleCountRows", () => {
  const summary: CompareFindingLifecycleSummary = {
    newlyIdentifiedCount: 1,
    previouslyIdentifiedStillPresentCount: 2,
    confirmedResolvedCount: 3,
    unverifiedResolvedCount: 4,
    absenceNotInformativeCount: 5,
    honestyNote: "Qualifier.",
  };

  it("keeps the three drop-out bases as separate rows", () => {
    const rows = buildCompareFindingLifecycleCountRows(summary);

    expect(rows.map((row) => row.value)).toEqual([1, 2, 3, 4, 5]);
  });

  it("never labels a row as plain resolved", () => {
    const rows = buildCompareFindingLifecycleCountRows(summary);

    expect(rows.some((row) => /^resolved/i.test(row.label))).toBe(false);
  });
});

describe("coerceCompareFindingLifecycleRecords", () => {
  it("returns an empty list for non-array payloads", () => {
    expect(coerceCompareFindingLifecycleRecords(null)).toEqual([]);
    expect(coerceCompareFindingLifecycleRecords({})).toEqual([]);
  });

  it("coerces lifecycle records and drops malformed rows", () => {
    const records = coerceCompareFindingLifecycleRecords([
      {
        state: "CandidateResolved",
        resolutionBasis: "Unverified",
        priorFindingId: "prior-1",
        currentFindingId: null,
        correlationMethod: "PolicyRuleAndFingerprint",
        severity: "High",
        category: "Network",
        message: "Open port",
        sourceAgent: "Critic",
        latestDisposition: null,
      },
      { state: "not-a-state" },
    ]);

    expect(records).toHaveLength(1);
    expect(records[0]?.priorFindingId).toBe("prior-1");
  });
});

describe("buildCompareFindingLifecycleStatusSentence", () => {
  const candidateResolved: CompareFindingLifecycleRecord = {
    state: "CandidateResolved",
    resolutionBasis: "ConfirmedByDisposition",
    priorFindingId: "prior-1",
    currentFindingId: null,
    correlationMethod: "PolicyRuleAndFingerprint",
    severity: "High",
    category: "Network",
    message: "Open port",
    sourceAgent: "Critic",
    latestDisposition: "Remediated",
  };

  it("never uses plain resolved wording", () => {
    const sentence = buildCompareFindingLifecycleStatusSentence(candidateResolved);

    expect(sentence.toLowerCase()).not.toContain("resolved");
    expect(sentence).toContain(compareFindingResolutionBasisLabel("ConfirmedByDisposition"));
  });
});

describe("comparePageHrefWithLifecycleAnchor", () => {
  it("appends the lifecycle anchor hash", () => {
    expect(comparePageHrefWithLifecycleAnchor("prior-run", "later-run")).toContain(
      "#compare-finding-lifecycle",
    );
  });
});
