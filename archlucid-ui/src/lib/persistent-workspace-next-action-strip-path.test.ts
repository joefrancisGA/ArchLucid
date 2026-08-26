import { describe, expect, it } from "vitest";

import { ARCHITECTURES_LIST_PATH, REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { isPersistentWorkspaceNextActionStripPath } from "@/lib/persistent-workspace-next-action-strip-path";

describe("isPersistentWorkspaceNextActionStripPath", () => {
  it("allows home, reviews, architecture drafts, and first review guide", () => {
    expect(isPersistentWorkspaceNextActionStripPath("/")).toBe(true);
    expect(isPersistentWorkspaceNextActionStripPath(REVIEWS_LIST_PATH)).toBe(true);
    expect(isPersistentWorkspaceNextActionStripPath(`${REVIEWS_LIST_PATH}/run-123`)).toBe(true);
    expect(isPersistentWorkspaceNextActionStripPath(ARCHITECTURES_LIST_PATH)).toBe(true);
    expect(isPersistentWorkspaceNextActionStripPath(`${ARCHITECTURES_LIST_PATH}/draft-1`)).toBe(true);
    expect(isPersistentWorkspaceNextActionStripPath(FIRST_REVIEW_GUIDE_PATH)).toBe(true);
  });

  it("blocks other operator surfaces such as preferences and help", () => {
    expect(isPersistentWorkspaceNextActionStripPath("/settings/preferences")).toBe(false);
    expect(isPersistentWorkspaceNextActionStripPath("/help/architecture-drafts")).toBe(false);
    expect(isPersistentWorkspaceNextActionStripPath("/governance")).toBe(false);
    expect(isPersistentWorkspaceNextActionStripPath("/architecture/reviews/new")).toBe(false);
  });
});
