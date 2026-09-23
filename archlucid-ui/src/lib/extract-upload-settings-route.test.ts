import { describe, expect, it } from "vitest";

import {
  EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
} from "@/lib/extract-upload-settings-evidence-copy";
import {
  extractUploadSettingsBreadcrumbParent,
  extractUploadSettingsNavHrefForPath,
  extractUploadSettingsPathForProductLine,
  isExtractUploadSettingsRoutePath,
} from "@/lib/extract-upload-settings-route";
import {
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
  SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  SECURENOW_INFRASTRUCTURE_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_HREF } from "@/lib/extract-upload-settings-page-copy";

describe("extract-upload-settings-route", () => {
  it("routes Architecture to Administration and SecureNow to Infrastructure namespace", () => {
    expect(extractUploadSettingsPathForProductLine("architecture")).toBe(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH);
    expect(extractUploadSettingsPathForProductLine("security")).toBe(SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH);
  });

  it("recognizes all canonical extract-upload route paths", () => {
    expect(isExtractUploadSettingsRoutePath(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH)).toBe(true);
    expect(isExtractUploadSettingsRoutePath(GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH)).toBe(true);
    expect(isExtractUploadSettingsRoutePath(SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH)).toBe(true);
    expect(isExtractUploadSettingsRoutePath("/administration/users")).toBe(false);
  });

  it("preserves pathname namespace for nav href", () => {
    expect(extractUploadSettingsNavHrefForPath(SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH)).toBe(
      SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    );
    expect(extractUploadSettingsNavHrefForPath(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH)).toBe(
      EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
    );
  });

  it("maps breadcrumb parent to Infrastructure or Administration", () => {
    expect(extractUploadSettingsBreadcrumbParent(SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH)).toEqual({
      href: SECURENOW_INFRASTRUCTURE_PATH,
      label: "Infrastructure overview",
    });
    expect(extractUploadSettingsBreadcrumbParent(GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH)).toEqual({
      href: GOVERNANCE_INFRASTRUCTURE_PATH,
      label: "Infrastructure overview",
    });
    expect(extractUploadSettingsBreadcrumbParent(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH)).toEqual({
      href: EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_HREF,
      label: "Administration",
    });
  });
});
