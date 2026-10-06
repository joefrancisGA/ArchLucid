import { describe, expect, it } from "vitest";

import {
  assignedToMeCountDataOrUndefined,
  hasAssignedToMeCountMismatch,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";

describe("assignedToMeCountDataOrUndefined", () => {
  it("keeps finite counts and drops null or non-finite values", () => {
    expect(assignedToMeCountDataOrUndefined(3)).toBe(3);
    expect(assignedToMeCountDataOrUndefined(0)).toBe(0);
    expect(assignedToMeCountDataOrUndefined(null)).toBeUndefined();
    expect(assignedToMeCountDataOrUndefined(undefined)).toBeUndefined();
    expect(assignedToMeCountDataOrUndefined(Number.NaN)).toBeUndefined();
  });
});

describe("hasAssignedToMeCountMismatch", () => {
  it("does not treat a missing count as a mismatch", () => {
    expect(
      hasAssignedToMeCountMismatch({
        isAssignedToMe: true,
        loading: false,
        loadFailed: false,
        assignedToMeCountData: undefined,
        assignedToMeLoadedFindingCount: 2,
      }),
    ).toBe(false);
  });
});
