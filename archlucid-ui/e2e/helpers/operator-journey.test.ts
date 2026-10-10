import { describe, expect, it } from "vitest";

import {
  findingJobViewChipListsRows,
  reviewDetailErrorShellMessage,
  shouldReloadReviewDetailAfterErrorShell,
} from "./operator-journey";

describe("review detail readiness diagnostics", () => {
  it("includes visible error-shell text for the early terminal failure", () => {
    expect(reviewDetailErrorShellMessage("Something went wrong API returned 503")).toBe(
      "Review detail error shell is visible (Something went wrong). Visible text: Something went wrong API returned 503",
    );
  });

  it("allows one reload before failing closed on the error shell", () => {
    expect(shouldReloadReviewDetailAfterErrorShell(0)).toBe(true);
    expect(shouldReloadReviewDetailAfterErrorShell(1)).toBe(false);
  });

  it("treats a zero job-view count as an empty findings list", () => {
    expect(findingJobViewChipListsRows("Needs my decision (0)")).toBe(false);
    expect(findingJobViewChipListsRows("Coverage gaps (6)")).toBe(true);
    expect(findingJobViewChipListsRows("Needs governance (10)")).toBe(true);
  });

});
