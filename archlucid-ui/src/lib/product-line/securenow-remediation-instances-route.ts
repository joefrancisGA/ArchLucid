import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  SECURENOW_REMEDIATION_INSTANCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Product-line canonical operator route for the remediation instances workbench. */
export function remediationInstancesPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_REMEDIATION_INSTANCES_PATH;
  }

  return GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH;
}

export function isRemediationInstancesRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH
    || bare === SECURENOW_REMEDIATION_INSTANCES_PATH;
}
