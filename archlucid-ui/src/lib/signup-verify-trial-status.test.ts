import { describe, expect, it } from "vitest";

import { isSignupWorkspaceReady } from "@/lib/signup-verify-trial-status";

describe("isSignupWorkspaceReady", () => {
  it("returns true when a sample run id is present", () => {
    expect(isSignupWorkspaceReady({ trialSampleRunId: "run-1" })).toBe(true);
  });

  it("returns false when status is None without run ids", () => {
    expect(isSignupWorkspaceReady({ status: "None" })).toBe(false);
  });
});
