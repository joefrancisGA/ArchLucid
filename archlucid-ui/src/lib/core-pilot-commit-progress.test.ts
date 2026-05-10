import { describe, expect, it } from "vitest";

import {
  corePilotStepBadgeLabel,
  deriveCorePilotCommitProgressState,
} from "@/lib/core-pilot-commit-progress";

describe("core-pilot-commit-progress", () => {
  it("committed wins even when latestRunId is null", () => {
    expect(deriveCorePilotCommitProgressState(true, null)).toBe("committed");
    expect(corePilotStepBadgeLabel("committed")).toBe("Step 4 of 4");
  });

  it("has-run when not committed but a run exists", () => {
    expect(deriveCorePilotCommitProgressState(false, "run-1")).toBe("has-run");
    expect(corePilotStepBadgeLabel("has-run")).toBe("Step 2–3 of 4");
  });

  it("no-run when no commit and no runs", () => {
    expect(deriveCorePilotCommitProgressState(false, null)).toBe("no-run");
    expect(corePilotStepBadgeLabel("no-run")).toBe("Step 1 of 4");
  });
});
