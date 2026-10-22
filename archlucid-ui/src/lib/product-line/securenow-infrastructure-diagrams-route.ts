import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Product-line canonical operator route for inventory diagrams. */
export function infrastructureDiagramsPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH;
  }

  return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH;
}

export function isInfrastructureDiagramsRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH
    || bare === SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH;
}
