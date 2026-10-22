import { describe, expect, it } from "vitest";

import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH, SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  auditEvidencePathForProductLine,
  findingsPathForProductLine,
  isAuditEvidenceLookupRoutePath,
  isFindingsRoutePath,
  isPolicyPacksRoutePath,
  isStandardsAndRulesRoutePath,
  policyPacksHubPathFromPathname,
  policyPacksPathForProductLine,
  standardsAndRulesPathForProductLine,
} from "@/lib/product-line/securenow-compliance-routes";

describe("securenow-compliance-routes", () => {
  it("routes SecureNow compliance hubs to /compliance and Architecture to /governance", () => {
    expect(policyPacksPathForProductLine("security")).toBe(SECURENOW_POLICY_PACKS_PATH);
    expect(policyPacksPathForProductLine("architecture")).toBe(GOVERNANCE_POLICY_PACKS_PATH);
    expect(standardsAndRulesPathForProductLine("security")).toBe(SECURENOW_STANDARDS_AND_RULES_PATH);
    expect(standardsAndRulesPathForProductLine("architecture")).toBe(GOVERNANCE_STANDARDS_AND_RULES_PATH);
    expect(findingsPathForProductLine("security")).toBe(SECURENOW_FINDINGS_PATH);
    expect(findingsPathForProductLine("architecture")).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(auditEvidencePathForProductLine("security")).toBe(SECURENOW_AUDIT_EVIDENCE_PATH);
    expect(auditEvidencePathForProductLine("architecture")).toBe(AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH);
  });

  it("recognizes governance and SecureNow compliance route families", () => {
    expect(isPolicyPacksRoutePath(SECURENOW_POLICY_PACKS_PATH)).toBe(true);
    expect(isPolicyPacksRoutePath(`${SECURENOW_POLICY_PACKS_PATH}/pack-1`)).toBe(true);
    expect(isStandardsAndRulesRoutePath(SECURENOW_STANDARDS_AND_RULES_PATH)).toBe(true);
    expect(isFindingsRoutePath(SECURENOW_FINDINGS_PATH)).toBe(true);
    expect(isAuditEvidenceLookupRoutePath(`${SECURENOW_AUDIT_EVIDENCE_PATH}/a/snapshots/s/controls/c`)).toBe(true);
    expect(isFindingsRoutePath("/security/assigned-to-me")).toBe(false);
    expect(isPolicyPacksRoutePath("/governance/findings")).toBe(false);
  });

  it("keeps policy pack hub path on the current product namespace", () => {
    expect(policyPacksHubPathFromPathname(`${SECURENOW_POLICY_PACKS_PATH}/pack-1`)).toBe(
      SECURENOW_POLICY_PACKS_PATH,
    );
    expect(policyPacksHubPathFromPathname(`${GOVERNANCE_POLICY_PACKS_PATH}/pack-1`)).toBe(
      GOVERNANCE_POLICY_PACKS_PATH,
    );
  });
});
