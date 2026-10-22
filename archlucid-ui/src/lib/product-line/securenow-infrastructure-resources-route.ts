import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Product-line canonical operator route for the resource explorer. */
export function infrastructureResourcesPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_INFRASTRUCTURE_RESOURCES_PATH;
  }

  return GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH;
}

export function infrastructureResourceHubPathForProductLine(
  productLine: ProductLineId,
  cloudResourceId: string,
): string {
  return `${infrastructureResourcesPathForProductLine(productLine)}/${cloudResourceId.trim()}`;
}

export function isInfrastructureResourcesRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH
    || bare === SECURENOW_INFRASTRUCTURE_RESOURCES_PATH
    || bare.startsWith(`${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}/`)
    || bare.startsWith(`${SECURENOW_INFRASTRUCTURE_RESOURCES_PATH}/`);
}
