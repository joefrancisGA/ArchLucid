import { describe, expect, it } from "vitest";

import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { resolveWorkingStartHref } from "@/lib/working-start-route";

describe("resolveWorkingStartHref (IS-03 / ADR 0069)", () => {
  it("prefers in-flight review over draft and new", () => {
    const result = resolveWorkingStartHref({
      inFlightReviewId: "run-in-flight",
      lastOpenDraftId: "draft-1",
    });

    expect(result.reason).toBe("in-flight-review");
    expect(result.href).toBe("/architecture/reviews/run-in-flight");
  });

  it("opens spawn-locked review instead of the draft editor", () => {
    const result = resolveWorkingStartHref({
      lastOpenDraftId: "draft-spawned",
      spawnLockedReviewId: "run-linked",
    });

    expect(result.reason).toBe("spawn-locked-review");
    expect(result.href).toBe("/architecture/reviews/run-linked");
  });

  it("resumes last-open draft when no review is active", () => {
    const result = resolveWorkingStartHref({
      lastOpenDraftId: "draft-42",
    });

    expect(result.reason).toBe("last-open-draft");
    expect(result.href).toBe("/architecture/architectures/draft-42");
  });

  it("falls back to new draft editor when workspace is empty", () => {
    const result = resolveWorkingStartHref({});

    expect(result.reason).toBe("new-draft");
    expect(result.href).toBe(ARCHITECTURES_NEW_PATH);
  });
});
