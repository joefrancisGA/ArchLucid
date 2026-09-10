import {
  GOVERNANCE_REMEDIATION_FACTORY_PATH,
  SECURENOW_REMEDIATION_FACTORY_PATH,
} from "@/lib/governance/governance-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Product-line canonical operator route for the remediation factory. */
export function remediationFactoryPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_REMEDIATION_FACTORY_PATH;
  }

  return GOVERNANCE_REMEDIATION_FACTORY_PATH;
}

export function isRemediationFactoryRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === GOVERNANCE_REMEDIATION_FACTORY_PATH
    || bare === SECURENOW_REMEDIATION_FACTORY_PATH;
}
