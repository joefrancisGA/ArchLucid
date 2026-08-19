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
  it("keeps primary CTA on start architecture review", () => {
    expect(FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.startArchitectureReview.href).toBe(
      "/architecture/reviews/new",
    );
    expect(FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openCustomerFirstReviewGuide.href).toBe(
      "/help/first-architecture-review",
    );
  });

  it("states Admin title honesty without the full pilot-path H1", () => {
    expect(FIRST_VALUE_20_HELP_PAGE_TITLE.toLowerCase()).toContain("20 minutes");
    expect(FIRST_VALUE_20_HELP_PAGE_TITLE.toLowerCase()).toContain("admin");
    expect(FIRST_VALUE_20_HELP_PAGE_TITLE.toLowerCase()).not.toContain("first-pilot operator path");
  });

  it("lists a job matrix with unique interactive destinations and a current-page row", () => {
    expect(FIRST_VALUE_20_HELP_JOB_MATRIX).toHaveLength(3);

    const interactiveRows = FIRST_VALUE_20_HELP_JOB_MATRIX.filter((row) => row.isCurrent !== true);
    const hrefs = interactiveRows.map((row) => row.href);
    const uniqueHrefs = new Set(hrefs);

    expect(uniqueHrefs.size).toBe(hrefs.length);
    expect(FIRST_VALUE_20_HELP_JOB_MATRIX.some((row) => row.href === "/help/first-architecture-review")).toBe(
      true,
    );
    expect(
      FIRST_VALUE_20_HELP_JOB_MATRIX.find((row) => row.isCurrent === true)?.href,
    ).toBe(FIRST_VALUE_20_HELP_CANONICAL_PATH);
  });

  it("keeps distinct CTA labels across primary actions and job matrix", () => {
    const labels = [
      FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.startArchitectureReview.label,
      FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openCustomerFirstReviewGuide.label,
      FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.openTroubleshooting.label,
      ...FIRST_VALUE_20_HELP_JOB_MATRIX.map((row) => row.label),
    ];
    const uniqueLabels = new Set(labels);

    expect(uniqueLabels.size).toBe(labels.length);
  });

  it("lists orientation steps and Sources without a self-link in Sources", () => {
    expect(FIRST_VALUE_20_HELP_ORIENTATION).toHaveLength(3);
    expect(FIRST_VALUE_20_HELP_SOURCES.some((link) => link.href === FIRST_VALUE_20_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });

  it("states claim discipline without implying certification", () => {
    expect(FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not certification");
    expect(FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE.toLowerCase()).not.toContain("cpa");
  });
});
