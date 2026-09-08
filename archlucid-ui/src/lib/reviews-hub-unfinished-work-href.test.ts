import { describe, expect, it } from "vitest";

import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  REVIEWS_HUB_UNFINISHED_WORK_HREF,
  resolveReviewsHubUnfinishedWorkHref,
} from "@/lib/reviews-hub-unfinished-work-href";

describe("reviews-hub-unfinished-work-href (SY-54)", () => {
  it("keeps the hub needs-attention filter for Guided mode", () => {
    expect(
      resolveReviewsHubUnfinishedWorkHref({
        workingMode: false,
      }),
    ).toBe(REVIEWS_HUB_UNFINISHED_WORK_HREF);
  });

  it("opens the last-open architecture desk on Working", () => {
    expect(
      resolveReviewsHubUnfinishedWorkHref({
        workingMode: true,
        lastOpenArchitectureId: "architecture-identity-001",
      }),
    ).toBe("/architecture/architectures/architecture-identity-001");
  });

  it("opens a nested in-flight review job when last-open is empty", () => {
    expect(
      resolveReviewsHubUnfinishedWorkHref({
        workingMode: true,
        inFlightParentArchitectureId: "architecture-identity-002",
        inFlightRunId: "run-in-flight-001",
      }),
    ).toBe("/architecture/architectures/architecture-identity-002/reviews/run-in-flight-001");
  });

  it("never uses the hub filter as the Working unfinished-work CTA", () => {
    const scenarios = [
      resolveReviewsHubUnfinishedWorkHref({
        workingMode: true,
        lastOpenArchitectureId: "architecture-identity-001",
      }),
      resolveReviewsHubUnfinishedWorkHref({
        workingMode: true,
        inFlightParentArchitectureId: "architecture-identity-002",
        inFlightRunId: "run-in-flight-001",
      }),
      resolveReviewsHubUnfinishedWorkHref({
        workingMode: true,
      }),
    ];

    for (const href of scenarios) {
      expect(href).not.toBe(REVIEWS_HUB_UNFINISHED_WORK_HREF);
      expect(href).not.toContain(`${REVIEWS_LIST_PATH}?filter=`);
    }
  });

  it("falls back to the architecture portfolio when Working has no desk context", () => {
    expect(
      resolveReviewsHubUnfinishedWorkHref({
        workingMode: true,
      }),
    ).toBe(ARCHITECTURES_LIST_PATH);
  });
});
