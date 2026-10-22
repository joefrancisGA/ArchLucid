import { describe, expect, it } from "vitest";

import { draftStatusAllowsWhatIfBranch } from "./draft-intake-branch-eligibility";

describe("draftStatusAllowsWhatIfBranch", () => {
  it("allows Admitted and RunSpawned drafts", () => {
    expect(draftStatusAllowsWhatIfBranch("Admitted")).toBe(true);
    expect(draftStatusAllowsWhatIfBranch("RunSpawned")).toBe(true);
  });

  it("blocks Submitted and other lifecycle states", () => {
    expect(draftStatusAllowsWhatIfBranch("Submitted")).toBe(false);
    expect(draftStatusAllowsWhatIfBranch("Drafting")).toBe(false);
    expect(draftStatusAllowsWhatIfBranch("Redirected")).toBe(false);
    expect(draftStatusAllowsWhatIfBranch("Abandoned")).toBe(false);
    expect(draftStatusAllowsWhatIfBranch(null)).toBe(false);
    expect(draftStatusAllowsWhatIfBranch(undefined)).toBe(false);
  });
});
