import { EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH } from "@/lib/extract-upload-settings-evidence-copy";
import {
  EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_HREF,
  EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
} from "@/lib/extract-upload-settings-page-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  SECURENOW_INFRASTRUCTURE_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-infrastructure-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type ExtractUploadSettingsBreadcrumbParent = {
  readonly href: string;
  readonly label: string;
};

/** Product-line canonical operator route for Extract & upload settings. */
export function extractUploadSettingsPathForProductLine(productLine: ProductLineId): string {
  if (productLine === "security") {
    return SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH;
  }

  return EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH;
}

export function isExtractUploadSettingsRoutePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined) {
    return false;
  }

  const bare = pathname.split("?", 1)[0] ?? pathname;

  return bare === EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH
    || bare === GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH
    || bare === SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH;
}

/** Nav href for OperatorPageHeader — preserves Infrastructure vs Administration namespace. */
export function extractUploadSettingsNavHrefForPath(pathname: string | null | undefined): string {
  if (isExtractUploadSettingsRoutePath(pathname)) {
    return pathname?.split("?", 1)[0] ?? EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH;
  }

  return EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH;
}

export function extractUploadSettingsBreadcrumbParent(
  pathname: string | null | undefined,
): ExtractUploadSettingsBreadcrumbParent {
  const bare = pathname?.split("?", 1)[0] ?? "";

  if (bare.startsWith(SECURENOW_INFRASTRUCTURE_PATH)) {
    return {
      href: SECURENOW_INFRASTRUCTURE_PATH,
      label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
    };
  }

  if (bare.startsWith(GOVERNANCE_INFRASTRUCTURE_PATH)) {
    return {
      href: GOVERNANCE_INFRASTRUCTURE_PATH,
      label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
    };
  }

  return {
    href: EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_HREF,
    label: EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
  };
}
