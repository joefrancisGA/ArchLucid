import { describe, expect, it } from "vitest";

import { RUNS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets-reviews";
import {
  emptyStateActionsForDesk,
  isSampleReviewEmptyStateAction,
} from "@/lib/operator/operator-desk-empty-state-actions";

describe("operator-desk-empty-state-actions (RS-15)", () => {
  it("filters sample review CTAs for Working live operator desks", () => {
    const filtered = emptyStateActionsForDesk({
      actions: RUNS_EMPTY_COMPACT.actions,
      workingMode: true,
      liveRecovery: true,
    });

    expect(filtered.some((action) => isSampleReviewEmptyStateAction(action))).toBe(false);
    expect(filtered.some((action) => action.href === "/architecture/reviews/new")).toBe(true);
  });

  it("keeps sample review CTAs in Guided mode", () => {
    const filtered = emptyStateActionsForDesk({
      actions: RUNS_EMPTY_COMPACT.actions,
      workingMode: false,
      liveRecovery: true,
    });

    expect(filtered.length).toBe(RUNS_EMPTY_COMPACT.actions?.length ?? 0);
  });
});
