import {
  AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
  SECURENOW_AUDIT_EVIDENCE_PATH,
} from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
  pathMatchesRoutePrefix,
} from "@/lib/governance/governance-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

const FINDINGS_QUEUE_EVIDENCE_LABELS = new Set<string>([
  "Findings",
  "Findings queue",
  "Findings tab",
]);

/** Remaps findings, standards, and policy-pack library links on hub Sources strips. */
export function remapHubPolicyAndFindingsEvidenceSources<T extends EvidenceSourceLink>(
  sources: readonly T[],
  productLine: ProductLineId,
): readonly T[] {
  if (productLine === "architecture") {
    return sources;
  }

  const findingsHref = findingsPathForProductLine(productLine);
  const standardsHref = standardsAndRulesPathForProductLine(productLine);
  const packsHref = policyPacksPathForProductLine(productLine);

  return sources.map((source) => {
    if (FINDINGS_QUEUE_EVIDENCE_LABELS.has(source.label)) {
      return { ...source, href: findingsHref };
    }

    if (source.label === "Standards & rules" || source.label === "Standards and rules") {
      return { ...source, href: standardsHref };
    }

    if (source.label === "Policy pack library" || source.label === "Policy packs") {
      return { ...source, href: packsHref };
    }

    return source;
  });
}

export function remapEvidenceSourceFindingsQueueHref<T extends EvidenceSourceLink>(
  sources: readonly T[],
  productLine: ProductLineId,
): readonly T[] {
  if (productLine === "architecture") {
    return sources;
  }

  const findingsHref = findingsPathForProductLine(productLine);

  return sources.map((source) => {
    if (!FINDINGS_QUEUE_EVIDENCE_LABELS.has(source.label)) {
      return source;
    }

    return { ...source, href: findingsHref };
  });
}

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

/** Product-line canonical operator route for assigned-to-me findings. */
export function assignedToMeFindingsPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH;
  }

  return GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH;
}

/** Preserves query strings when remapping governance hub paths for SecureNow. */
export function remapGovernanceOperatorHref(href: string, productLine: ProductLineId): string {
  if (productLine === "architecture") {
    return href;
  }

  const queryIndex = href.indexOf("?");
  const path = queryIndex >= 0 ? href.slice(0, queryIndex) : href;
  const querySuffix = queryIndex >= 0 ? href.slice(queryIndex) : "";

  if (path === GOVERNANCE_FINDINGS_PATH) {
    return `${findingsPathForProductLine(productLine)}${querySuffix}`;
  }

  if (path === GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH) {
    return `${assignedToMeFindingsPathForProductLine(productLine)}${querySuffix}`;
  }

  if (path === GOVERNANCE_POLICY_PACKS_PATH) {
    return `${policyPacksPathForProductLine(productLine)}${querySuffix}`;
  }

  if (path === GOVERNANCE_STANDARDS_AND_RULES_PATH) {
    return `${standardsAndRulesPathForProductLine(productLine)}${querySuffix}`;
  }

  return href;
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

/** Policy packs hub for client handoffs: pathname wins on pack routes; otherwise product line. */
export function resolvePolicyPacksHubPath(
  pathname: string | null | undefined,
  productLine: ProductLineId,
): string {
  if (isPolicyPacksRoutePath(pathname)) {
    return policyPacksHubPathFromPathname(pathname);
  }

  return policyPacksPathForProductLine(productLine);
}
