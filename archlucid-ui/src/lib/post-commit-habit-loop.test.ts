import { describe, expect, it, vi } from "vitest";

import { buildPostCommitHabitLoop } from "@/lib/post-commit-habit-loop";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
}));

describe("buildPostCommitHabitLoop", () => {
  it("returns one primary sponsor action and optional compare when enabled", () => {
    const loop = buildPostCommitHabitLoop({
      runId: "run-1",
      manifestId: "manifest-1",
      showCompareCta: true,
      buyerShowcaseQuickLinks: false,
      goldenManifestId: "manifest-1",
    });

    expect(loop.primary.id).toBe("sponsor-packet");
    expect(loop.primary.kind).toBe("primary");
    expect(loop.optional.some((action) => action.id === "compare")).toBe(true);
    expect(loop.optional.some((action) => action.id === "evidence-chain")).toBe(true);
    expect(loop.optional.some((action) => action.id === "value-delta")).toBe(true);
    expect(loop.optional.some((action) => action.id === "second-review")).toBe(true);
  });

  it("omits compare optional action when compare is unavailable", () => {
    const loop = buildPostCommitHabitLoop({
      runId: "run-1",
      manifestId: "manifest-1",
      showCompareCta: false,
      buyerShowcaseQuickLinks: false,
      goldenManifestId: "manifest-1",
    });

    expect(loop.optional.some((action) => action.id === "compare")).toBe(false);
  });
});
