import { describe, expect, it } from "vitest";

import {
  EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH,
} from "@/lib/extract-upload-settings-evidence-copy";
import {
  extractUploadSettingsPathForProductLine,
  isExtractUploadSettingsRoutePath,
} from "@/lib/extract-upload-settings-route";
import { GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

describe("extract-upload-settings-route", () => {
  it("routes Architecture to Administration and SecureNow to Infrastructure", () => {
    expect(extractUploadSettingsPathForProductLine("architecture")).toBe(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH);
    expect(extractUploadSettingsPathForProductLine("security")).toBe(GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH);
  });

  it("recognizes both canonical extract-upload route paths", () => {
    expect(isExtractUploadSettingsRoutePath(EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH)).toBe(true);
    expect(isExtractUploadSettingsRoutePath(GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH)).toBe(true);
    expect(isExtractUploadSettingsRoutePath("/administration/users")).toBe(false);
  });
});
