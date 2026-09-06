import { describe, expect, it } from "vitest";

import {
  formatPreCommitGateDisabledCareerBlockedReason,
  PRE_COMMIT_GATE_DISABLED_CAREER_COPY,
} from "@/lib/governance/pre-commit-gate-career-honesty";

describe("pre-commit-gate-career-honesty (DR-04)", () => {
  it("returns career block copy when the gate is disabled", () => {
    expect(formatPreCommitGateDisabledCareerBlockedReason(false)).toBe(
      PRE_COMMIT_GATE_DISABLED_CAREER_COPY,
    );
  });

  it("does not block when the gate is enabled or unknown", () => {
    expect(formatPreCommitGateDisabledCareerBlockedReason(true)).toBeNull();
    expect(formatPreCommitGateDisabledCareerBlockedReason(null)).toBeNull();
    expect(formatPreCommitGateDisabledCareerBlockedReason(undefined)).toBeNull();
  });
});
