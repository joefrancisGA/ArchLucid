import { describe, expect, it } from "vitest";

import { resolveReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";

describe("resolveReviewWorkspaceLifecycle (TB-2367)", () => {
  it("returns create-home when the create-home workspace is active", () => {
    expect(
      resolveReviewWorkspaceLifecycle({
        showArchitectureCreatedHome: true,
        manifestId: null,
        showProgressTracker: false,
        runCompleted: false,
      }),
    ).toBe("create-home");
  });

  it("returns finalized when a manifest is present", () => {
    expect(
      resolveReviewWorkspaceLifecycle({
        manifestId: "manifest-1",
        showProgressTracker: false,
        runCompleted: true,
      }),
    ).toBe("finalized");
  });

  it("returns in-review for pre-finalize committed workspace routes", () => {
    expect(
      resolveReviewWorkspaceLifecycle({
        manifestId: null,
        showProgressTracker: true,
        runCompleted: false,
      }),
    ).toBe("in-review");
  });

  it("returns finalized when manifest is present even if the progress tracker is still on (TB-2175)", () => {
    expect(
      resolveReviewWorkspaceLifecycle({
        manifestId: "manifest-early",
        showProgressTracker: true,
        runCompleted: false,
      }),
    ).toBe("finalized");
  });
});
