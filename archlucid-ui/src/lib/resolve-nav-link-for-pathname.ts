import type { LucideIcon } from "lucide-react";

import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH, SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
  SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
  SECURENOW_REMEDIATION_INSTANCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  SECURENOW_FINDINGS_PATH,
  SECURENOW_POLICY_PACKS_PATH,
  SECURENOW_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { flattenNavLinks } from "@/lib/nav-config";
import type { NavLinkItem } from "@/lib/nav-config.types";

/** SecureNow routes that reuse governance nav-config identity (icon + longest-prefix match). */
const SECURENOW_NAV_LOOKUP_ALIASES: Readonly<Record<string, string>> = {
  [SECURENOW_POLICY_PACKS_PATH]: GOVERNANCE_POLICY_PACKS_PATH,
  [SECURENOW_STANDARDS_AND_RULES_PATH]: GOVERNANCE_STANDARDS_AND_RULES_PATH,
  [SECURENOW_FINDINGS_PATH]: GOVERNANCE_FINDINGS_PATH,
  [SECURENOW_AUDIT_EVIDENCE_PATH]: AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
  [SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH]: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  [SECURENOW_INFRASTRUCTURE_RESOURCES_PATH]: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  [SECURENOW_REMEDIATION_INSTANCES_PATH]: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
};

function hrefToPathname(href: string): string {
  try {
    return new URL(href, "https://archlucid.invalid").pathname;
  } catch {
    return href.split("?")[0] ?? href;
  }
}

function normalizeNavLookupPathname(pathname: string): string {
  const exact = SECURENOW_NAV_LOOKUP_ALIASES[pathname];

  if (exact !== undefined) {
    return exact;
  }

  let bestAlias: string | undefined;
  let bestCanonical: string | undefined;

  for (const [alias, canonical] of Object.entries(SECURENOW_NAV_LOOKUP_ALIASES)) {
    if (!pathname.startsWith(`${alias}/`)) {
      continue;
    }

    if (bestAlias === undefined || alias.length > bestAlias.length) {
      bestAlias = alias;
      bestCanonical = canonical;
    }
  }

  if (bestAlias === undefined || bestCanonical === undefined) {
    return pathname;
  }

  return `${bestCanonical}${pathname.slice(bestAlias.length)}`;
}

function pathMatchesNavHref(pathname: string, linkHref: string | undefined): boolean {
  if (linkHref === undefined || linkHref === "") {
    return false;
  }

  const linkPath = hrefToPathname(linkHref);

  if (linkPath === "/") {
    return pathname === "/";
  }

  if (pathname === linkPath) {
    return true;
  }

  // Query-scoped nav rows (e.g. /architecture/reviews) apply to that list surface only.
  if (linkHref.includes("?")) {
    return false;
  }

  return pathname.startsWith(`${linkPath}/`);
}

/**
 * Resolves the best matching configured nav link for a pathname (longest nav path wins).
 * Navigation config is the authoritative source for route identity icons.
 */
export function resolveNavLinkForPathname(pathname: string): NavLinkItem | undefined {
  const normalizedPath = normalizeNavLookupPathname(hrefToPathname(pathname));
  let bestMatch: NavLinkItem | undefined;
  let bestLength = -1;

  for (const link of flattenNavLinks()) {
    const linkPath = hrefToPathname(link.href);

    if (!pathMatchesNavHref(normalizedPath, link.href)) {
      continue;
    }

    if (linkPath.length > bestLength) {
      bestMatch = link;
      bestLength = linkPath.length;
    }
  }

  return bestMatch;
}

/** Resolves the nav icon for a canonical nav href or current pathname. */
export function resolveNavIconForHref(hrefOrPathname: string): LucideIcon | undefined {
  return resolveNavLinkForPathname(hrefOrPathname)?.icon;
}
