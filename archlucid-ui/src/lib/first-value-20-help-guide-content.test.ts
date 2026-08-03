import { describe, expect, it } from "vitest";

import {
  FIRST_VALUE_20_HELP_CANONICAL_PATH,
  FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE,
  FIRST_VALUE_20_HELP_JOB_MATRIX,
  FIRST_VALUE_20_HELP_ORIENTATION,
  FIRST_VALUE_20_HELP_PAGE_TITLE,
  FIRST_VALUE_20_HELP_PRIMARY_ACTIONS,
  FIRST_VALUE_20_HELP_SOURCES,
} from "@/lib/first-value-20-help-guide-content";

describe("first-value-20-help-guide-content", () => {
  it("keeps primary CTA on the buyer first-architecture-review path", () => {
    expect(FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openBuyerFirstReview.href).toBe(
      "/help/first-architecture-review",
    );
    expect(FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.startArchitectureReview.href).toBe(
      "/architecture/reviews/new",
    );
  });

  it("states Admin title honesty without the full pilot-path H1", () => {
    expect(FIRST_VALUE_20_HELP_PAGE_TITLE.toLowerCase()).toContain("20 minutes");
    expect(FIRST_VALUE_20_HELP_PAGE_TITLE.toLowerCase()).toContain("admin");
    expect(FIRST_VALUE_20_HELP_PAGE_TITLE.toLowerCase()).not.toContain("first-pilot operator path");
  });

  it("lists a job matrix covering buyer, workflow, checklist, and this Admin runbook", () => {
    expect(FIRST_VALUE_20_HELP_JOB_MATRIX).toHaveLength(4);
    expect(FIRST_VALUE_20_HELP_JOB_MATRIX.some((row) => row.href === "/help/first-architecture-review")).toBe(
      true,
    );
    expect(FIRST_VALUE_20_HELP_JOB_MATRIX.some((row) => row.href === FIRST_VALUE_20_HELP_CANONICAL_PATH)).toBe(
      true,
    );
  });

  it("lists orientation steps and Sources without a self-link in Sources", () => {
    expect(FIRST_VALUE_20_HELP_ORIENTATION).toHaveLength(3);
    expect(FIRST_VALUE_20_HELP_SOURCES.some((link) => link.href === FIRST_VALUE_20_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });

  it("states claim discipline without implying certification", () => {
    expect(FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not certification");
    expect(FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("cpa");
  });
});
