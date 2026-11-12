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
  remapEvidenceSourceFindingsQueueHref,
  remapHubPolicyAndFindingsEvidenceSources,
  resolvePolicyPacksHubPath,
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

  it("remaps hub policy, standards, and findings Source labels for SecureNow", () => {
    const hubSources = [
      { label: "Findings tab", href: GOVERNANCE_FINDINGS_PATH },
      { label: "Standards and rules", href: GOVERNANCE_STANDARDS_AND_RULES_PATH },
      { label: "Policy pack library", href: GOVERNANCE_POLICY_PACKS_PATH },
      { label: "Audit", href: "/governance/audit" },
    ] as const;

    expect(remapHubPolicyAndFindingsEvidenceSources(hubSources, "architecture")).toBe(hubSources);
    const remapped = remapHubPolicyAndFindingsEvidenceSources(hubSources, "security");

    expect(remapped[0]?.href).toBe(SECURENOW_FINDINGS_PATH);
    expect(remapped[1]?.href).toBe(SECURENOW_STANDARDS_AND_RULES_PATH);
    expect(remapped[2]?.href).toBe(SECURENOW_POLICY_PACKS_PATH);
    expect(remapped[3]?.href).toBe("/governance/audit");
  });

  it("remaps findings queue Source labels for SecureNow", () => {
    const sources = [
      { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
      { label: "Audit", href: "/governance/audit" },
    ] as const;

    expect(remapEvidenceSourceFindingsQueueHref(sources, "architecture")).toBe(sources);
    expect(remapEvidenceSourceFindingsQueueHref(sources, "security")[0]?.href).toBe(SECURENOW_FINDINGS_PATH);
  });

  it("resolves policy packs hub from pathname on pack routes and product line elsewhere", () => {
    expect(resolvePolicyPacksHubPath(`${SECURENOW_POLICY_PACKS_PATH}/pack-1`, "architecture")).toBe(
      SECURENOW_POLICY_PACKS_PATH,
    );
    expect(resolvePolicyPacksHubPath("/insights/compare-two-reviews", "security")).toBe(SECURENOW_POLICY_PACKS_PATH);
    expect(resolvePolicyPacksHubPath("/insights/compare-two-reviews", "architecture")).toBe(GOVERNANCE_POLICY_PACKS_PATH);
  });
});
