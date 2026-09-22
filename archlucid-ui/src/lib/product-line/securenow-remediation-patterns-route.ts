import {
  GOVERNANCE_REMEDIATION_PATTERNS_PATH,
  SECURENOW_REMEDIATION_PATTERNS_PATH,
} from "@/lib/governance/governance-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Product-line canonical operator route for the remediation pattern registry. */
export function remediationPatternsPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_REMEDIATION_PATTERNS_PATH;
  }

  return GOVERNANCE_REMEDIATION_PATTERNS_PATH;
}

export function isRemediationPatternsRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === GOVERNANCE_REMEDIATION_PATTERNS_PATH
    || bare === SECURENOW_REMEDIATION_PATTERNS_PATH;
}
