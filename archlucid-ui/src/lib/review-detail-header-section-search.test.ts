import { describe, expect, it } from "vitest";

import {
  findReviewDetailSectionSearchMatches,
  isReviewDetailHeaderSearchPath,
} from "./review-detail-header-section-search";

describe("review detail header section search", () => {
  it("detects review detail paths but not the reviews hub list", () => {
    expect(isReviewDetailHeaderSearchPath("/architecture/reviews/run-abc")).toBe(true);
    expect(isReviewDetailHeaderSearchPath("/architecture/reviews")).toBe(false);
    expect(isReviewDetailHeaderSearchPath("/architecture/reviews/new")).toBe(false);
  });

  it("matches visible on-this-page section links", () => {
    document.body.innerHTML = `
      <nav aria-label="On this page sections">
        <a href="#artifacts-exports">Deliverables</a>
        <a href="#governance-decision">Governance decision</a>
      </nav>
    `;

    expect(findReviewDetailSectionSearchMatches("governance")).toEqual([
      { sectionId: "governance-decision", label: "Governance decision" },
    ]);
  });
});
