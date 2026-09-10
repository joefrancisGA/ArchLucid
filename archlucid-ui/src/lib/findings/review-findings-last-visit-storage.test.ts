import { afterEach, describe, expect, it } from "vitest";

import {
  clearReviewFindingsLastVisitStorage,
  patchReviewFindingsLastVisit,
  readReviewFindingsLastVisit,
  REVIEW_FINDINGS_LAST_VISIT_STORAGE_KEY,
} from "@/lib/findings/review-findings-last-visit-storage";

describe("review-findings-last-visit-storage", () => {
  afterEach(() => {
    clearReviewFindingsLastVisitStorage();
  });

  it("returns defaults when unset for a run", () => {
    expect(readReviewFindingsLastVisit("run-1")).toEqual({
      filter: "all",
      jobView: "needs-my-decision",
      searchQuery: "",
      ownerFilter: "",
      domainFilter: "",
      originFilter: "all",
      groundingFilter: "all",
      sort: "trust-then-severity",
      classificationBand: "decision-grade",
      hideGenericLowDensity: false,
    });
  });

  it("round-trips per-run filter state", () => {
    patchReviewFindingsLastVisit("run-abc", {
      filter: "high",
      searchQuery: "encryption",
      classificationBand: "checklist",
      hideGenericLowDensity: true,
    });

    expect(readReviewFindingsLastVisit("run-abc")).toMatchObject({
      filter: "high",
      searchQuery: "encryption",
      classificationBand: "checklist",
      hideGenericLowDensity: true,
    });
    expect(readReviewFindingsLastVisit("run-other").filter).toBe("all");
  });

  it("persists to localStorage", () => {
    patchReviewFindingsLastVisit("run-1", { filter: "critical" });

    const raw = window.localStorage.getItem(REVIEW_FINDINGS_LAST_VISIT_STORAGE_KEY);

    expect(raw).toContain("run-1");
    expect(raw).toContain("critical");
  });
});
