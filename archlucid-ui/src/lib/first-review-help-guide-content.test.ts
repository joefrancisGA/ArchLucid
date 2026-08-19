import { describe, expect, it } from "vitest";

import {
  FIRST_REVIEW_HELP_CANONICAL_PATH,
  FIRST_REVIEW_HELP_CLAIM_DISCIPLINE,
  FIRST_REVIEW_HELP_EVIDENCE_ARC,
  FIRST_REVIEW_HELP_PRIMARY_ACTIONS,
  FIRST_REVIEW_HELP_SOURCES,
} from "@/lib/first-review-help-guide-content";

describe("first-review-help-guide-content", () => {
  it("keeps primary CTAs on buyer first-review, start review, and audit", () => {
    expect(FIRST_REVIEW_HELP_PRIMARY_ACTIONS.openBuyerFirstReview.href).toBe(
      "/help/first-architecture-review",
    );
    expect(FIRST_REVIEW_HELP_PRIMARY_ACTIONS.startArchitectureReview.href).toBe(
      "/architecture/reviews/new",
    );
    expect(FIRST_REVIEW_HELP_PRIMARY_ACTIONS.openAuditTrail.href).toBe("/governance/audit");
  });

  it("lists a five-beat evidence arc", () => {
    expect(FIRST_REVIEW_HELP_EVIDENCE_ARC).toHaveLength(5);
    expect(FIRST_REVIEW_HELP_EVIDENCE_ARC[2]?.toLowerCase()).toContain("finalize");
  });

  it("lists Sources without a self-link to this topic", () => {
    expect(
      FIRST_REVIEW_HELP_SOURCES.some((link) => link.href === FIRST_REVIEW_HELP_CANONICAL_PATH),
    ).toBe(false);
    expect(FIRST_REVIEW_HELP_SOURCES.some((link) => link.href.includes("first-architecture-review"))).toBe(
      true,
    );
  });

  it("states claim discipline without implying certification", () => {
    expect(FIRST_REVIEW_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not certification");
    expect(FIRST_REVIEW_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
  });
});
