import { describe, expect, it } from "vitest";

import {
  SECURENOW_BUYER_GOVERNANCE_ASSIGNED_TO_ME_PAGE_LEAD,
  SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_PAGE_SUBTITLE,
  SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE,
  SECURENOW_GOVERNANCE_JOB_ASSIGNED_TO_ME_WHEN_TO_USE,
  SECURENOW_GOVERNANCE_JOB_RECORD_DECISIONS_WHEN_TO_USE,
  resolveGovernanceAssignedToMeClaimDiscipline,
  resolveGovernanceAssignedToMePageSubtitle,
  resolveGovernanceJobAssignedToMeWhenToUse,
  resolveGovernanceJobRecordDecisionsWhenToUse,
  shouldShowGovernanceAssignedToMeWorkspaceLabel,
} from "@/lib/product-line/securenow-governance-assigned-to-me-copy";

describe("securenow-governance-assigned-to-me-copy", () => {
  it("uses issue-first remediation copy without workspace verbiage on SecureNow", () => {
    expect(resolveGovernanceAssignedToMePageSubtitle("security", false)).toBe(
      SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_PAGE_SUBTITLE,
    );
    expect(resolveGovernanceAssignedToMePageSubtitle("security", true)).toBe(
      SECURENOW_BUYER_GOVERNANCE_ASSIGNED_TO_ME_PAGE_LEAD,
    );
    expect(SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_PAGE_SUBTITLE).toContain("across issues");
    expect(SECURENOW_GOVERNANCE_ASSIGNED_TO_ME_PAGE_SUBTITLE).not.toContain("workspace");
    expect(SECURENOW_BUYER_GOVERNANCE_ASSIGNED_TO_ME_PAGE_LEAD).not.toContain("workspace");
  });

  it("keeps ArchLucid workspace and review copy unchanged", () => {
    expect(resolveGovernanceAssignedToMePageSubtitle("architecture", false)).toContain("workspace");
    expect(resolveGovernanceAssignedToMePageSubtitle("architecture", false)).toContain("across reviews");
  });

  it("localizes assigned-to-me claim discipline and job-router helper copy", () => {
    expect(resolveGovernanceAssignedToMeClaimDiscipline("security", false)).toBe(
      SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE,
    );
    expect(SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE).toContain("across issues");
    expect(SECURENOW_GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE).not.toContain("workspace");

    expect(resolveGovernanceJobAssignedToMeWhenToUse("security")).toBe(
      SECURENOW_GOVERNANCE_JOB_ASSIGNED_TO_ME_WHEN_TO_USE,
    );
    expect(resolveGovernanceJobRecordDecisionsWhenToUse("security")).toBe(
      SECURENOW_GOVERNANCE_JOB_RECORD_DECISIONS_WHEN_TO_USE,
    );
    expect(SECURENOW_GOVERNANCE_JOB_RECORD_DECISIONS_WHEN_TO_USE).toContain("security decisions");
    expect(SECURENOW_GOVERNANCE_JOB_RECORD_DECISIONS_WHEN_TO_USE).not.toContain("architecture decisions");
  });

  it("hides the assigned-to-me workspace label on SecureNow only", () => {
    expect(shouldShowGovernanceAssignedToMeWorkspaceLabel("security")).toBe(false);
    expect(shouldShowGovernanceAssignedToMeWorkspaceLabel("architecture")).toBe(true);
  });
});
