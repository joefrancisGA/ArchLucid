import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Product-line canonical operator route for the assigned-to-me findings queue. */
export function assignedToMeFindingsPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH;
  }

  return GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH;
}

export function isAssignedToMeFindingsRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH
    || bare === SECURENOW_ASSIGNED_TO_ME_FINDINGS_PATH;
}
