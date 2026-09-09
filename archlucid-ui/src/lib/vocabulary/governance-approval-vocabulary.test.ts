import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_APPROVAL_HOW_IT_WORKS_LABEL,
  GOVERNANCE_APPROVAL_JOB_LABEL,
  GOVERNANCE_APPROVAL_LABEL,
  GOVERNANCE_APPROVAL_SUBMIT_LABEL,
} from "@/lib/vocabulary/governance-approval-vocabulary";

describe("governance-approval-vocabulary", () => {
  it("uses approval product language instead of resolve outcomes", () => {
    const corpus = [
      GOVERNANCE_APPROVAL_LABEL,
      GOVERNANCE_APPROVAL_JOB_LABEL,
      GOVERNANCE_APPROVAL_SUBMIT_LABEL,
      GOVERNANCE_APPROVAL_HOW_IT_WORKS_LABEL,
    ]
      .join(" ")
      .toLowerCase();

    expect(corpus).toContain("approval");
    expect(corpus).not.toContain("governance");
    expect(corpus).not.toContain("resolve outcomes");
  });

  it("aligns job-router label with verb-led sibling cards", () => {
    expect(GOVERNANCE_APPROVAL_JOB_LABEL.toLowerCase()).toMatch(/approv/);
  });
});
