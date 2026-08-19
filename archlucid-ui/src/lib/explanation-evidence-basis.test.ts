import { describe, expect, it } from "vitest";

import { resolveExplanationEvidenceBasisBadges } from "./explanation-evidence-basis";

describe("resolveExplanationEvidenceBasisBadges", () => {
  it("marks cited explanations as evidence-backed", () => {
    const badges = resolveExplanationEvidenceBasisBadges({
      citationCount: 3,
      faithfulnessSupportRatio: 0.86,
    });

    expect(badges.map((badge) => badge.label)).toEqual(["evidence-backed"]);
    expect(badges[0]?.warnBeforeSponsorSend).toBe(false);
  });

  it("caveats low-support explanations", () => {
    const badges = resolveExplanationEvidenceBasisBadges({
      citationCount: 3,
      faithfulnessSupportRatio: 0.42,
    });

    expect(badges.map((badge) => badge.label)).toEqual(["low-support"]);
    expect(badges[0]?.warnBeforeSponsorSend).toBe(true);
  });

  it("combines demo, estimate, and deferred labels", () => {
    const badges = resolveExplanationEvidenceBasisBadges({
      demoDerived: true,
      estimateOnly: true,
      deferredScope: true,
    });

    expect(badges.map((badge) => badge.label)).toEqual(["demo-derived", "deferred-scope", "estimate"]);
    expect(badges.every((badge) => badge.warnBeforeSponsorSend)).toBe(true);
  });

  it("requires manual review when no basis is available", () => {
    const badges = resolveExplanationEvidenceBasisBadges({});

    expect(badges.map((badge) => badge.label)).toEqual(["manual-review-required"]);
  });
});
