import { describe, expect, it } from "vitest";

import {
  PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE,
  resolvePersistentWorkspaceNextAction,
} from "@/lib/persistent-workspace-next-action";

describe("resolvePersistentWorkspaceNextAction", () => {
  const inProgress = {
    allDone: false,
    completedCount: 2,
    totalCount: 7,
    nextStepIndex: 2,
  };

  it("returns null when all steps are done", () => {
    expect(
      resolvePersistentWorkspaceNextAction(
        { allDone: true, completedCount: 7, totalCount: 7, nextStepIndex: null },
        "/architecture/reviews/new",
        "Start review",
        "Finalize the review",
      ),
    ).toBeNull();
  });

  it("links to the next Core Pilot step when available", () => {
    const action = resolvePersistentWorkspaceNextAction(
      inProgress,
      "/architecture/reviews/new",
      "Start review",
      "Finalize the review",
    );

    expect(action?.headline).toBe(PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE);
    expect(action?.detail).toBe("2 of 7 steps complete");
    expect(action?.nextStepTitle).toBe("Finalize the review");
    expect(action?.actionLabel).toBe("Start review");
    expect(action?.href).toBe("/architecture/reviews/new");
  });

  it("falls back to the first review guide when no step href is known", () => {
    const action = resolvePersistentWorkspaceNextAction(inProgress, null, null);

    expect(action?.headline).toBe(PERSISTENT_WORKSPACE_FIRST_REVIEW_HEADLINE);
    expect(action?.href).toBe("/architecture/first-review-guide");
    expect(action?.actionLabel).toBe("Open guide");
    expect(action?.nextStepTitle).toBeNull();
  });
});
