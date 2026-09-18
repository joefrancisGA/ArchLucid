import {
  AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
  SECURENOW_AUDIT_EVIDENCE_PATH,
} from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
  pathMatchesRoutePrefix,
} from "@/lib/governance/governance-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

function barePathname(pathname: string | null | undefined): string | null {
  if (pathname === null || pathname === undefined) {
    return null;
  }

  return pathname.split("?", 1)[0] ?? pathname;
}

/** Product-line canonical operator route for the policy packs hub. */
export function policyPacksPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_POLICY_PACKS_PATH;
  }

  return GOVERNANCE_POLICY_PACKS_PATH;
}

/** Product-line canonical operator route for standards and rules. */
export function standardsAndRulesPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_STANDARDS_AND_RULES_PATH;
  }

  return GOVERNANCE_STANDARDS_AND_RULES_PATH;
}

/** Product-line canonical operator route for the tenant findings queue. */
export function findingsPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_FINDINGS_PATH;
  }

  return GOVERNANCE_FINDINGS_PATH;
}

/** Product-line canonical operator route for audit evidence lookup. */
export function auditEvidencePathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_AUDIT_EVIDENCE_PATH;
  }

  return AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH;
}

export function isPolicyPacksRoutePath(pathname: string | null | undefined): boolean {
  const bare = barePathname(pathname);

  if (bare === null) {
    return false;
  }

  return pathMatchesRoutePrefix(bare, GOVERNANCE_POLICY_PACKS_PATH)
    || pathMatchesRoutePrefix(bare, SECURENOW_POLICY_PACKS_PATH);
}

export function isStandardsAndRulesRoutePath(pathname: string | null | undefined): boolean {
  const bare = barePathname(pathname);

  if (bare === null) {
    return false;
  }

  return pathMatchesRoutePrefix(bare, GOVERNANCE_STANDARDS_AND_RULES_PATH)
    || pathMatchesRoutePrefix(bare, SECURENOW_STANDARDS_AND_RULES_PATH);
}

export function isFindingsRoutePath(pathname: string | null | undefined): boolean {
  const bare = barePathname(pathname);

  if (bare === null) {
    return false;
  }

  return bare === GOVERNANCE_FINDINGS_PATH
    || bare === SECURENOW_FINDINGS_PATH
    || bare.startsWith(`${GOVERNANCE_FINDINGS_PATH}/`)
    || bare.startsWith(`${SECURENOW_FINDINGS_PATH}/`);
}

export function isAuditEvidenceLookupRoutePath(pathname: string | null | undefined): boolean {
  const bare = barePathname(pathname);

  if (bare === null) {
    return false;
  }

  return pathMatchesRoutePrefix(bare, AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH)
    || pathMatchesRoutePrefix(bare, SECURENOW_AUDIT_EVIDENCE_PATH);
}

/** Hub path for policy pack detail links when the current page is already a packs route. */
export function policyPacksHubPathFromPathname(pathname: string | null | undefined): string {
  const bare = barePathname(pathname);

  if (bare !== null && pathMatchesRoutePrefix(bare, SECURENOW_POLICY_PACKS_PATH)) {
    return SECURENOW_POLICY_PACKS_PATH;
  }

  return GOVERNANCE_POLICY_PACKS_PATH;
}
