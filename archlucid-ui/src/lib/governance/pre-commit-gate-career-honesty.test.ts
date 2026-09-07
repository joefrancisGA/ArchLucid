import { describe, expect, it } from "vitest";

import {
  formatPreCommitGateDisabledCareerBlockedReason,
  PRE_COMMIT_GATE_DISABLED_CAREER_COPY,
  PRE_COMMIT_GATE_DISABLED_TITLE,
} from "@/lib/governance/pre-commit-gate-career-honesty";

describe("pre-commit-gate-career-honesty (DR-04)", () => {
  it("returns career block copy when the gate is disabled", () => {
    expect(PRE_COMMIT_GATE_DISABLED_TITLE).toBe("Finalize will not be blocked by policy");
    expect(formatPreCommitGateDisabledCareerBlockedReason(false)).toBe(
      PRE_COMMIT_GATE_DISABLED_CAREER_COPY,
    );
    expect(PRE_COMMIT_GATE_DISABLED_CAREER_COPY).toBe(
      "Serious findings can still be sealed here. This is not a fully governed review record.",
    );
  });

  it("does not block when the gate is enabled or unknown", () => {
    expect(formatPreCommitGateDisabledCareerBlockedReason(true)).toBeNull();
    expect(formatPreCommitGateDisabledCareerBlockedReason(null)).toBeNull();
    expect(formatPreCommitGateDisabledCareerBlockedReason(undefined)).toBeNull();
  });
});
