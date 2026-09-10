import { EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH } from "@/lib/extract-upload-settings-evidence-copy";
import { GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Product-line canonical operator route for Extract & upload settings. */
export function extractUploadSettingsPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH;
  }

  return EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH;
}

export function isExtractUploadSettingsRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH
    || bare === GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH;
}
