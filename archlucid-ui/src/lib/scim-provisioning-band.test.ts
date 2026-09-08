import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SCIM_PROVISIONING_BAND_TEST_FILES = [
  "src/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient.test.tsx",
  "src/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningCreateConfirmDialog.test.tsx",
  "src/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningRevokeConfirmDialog.test.tsx",
  "e2e/live-api-scim-invite-substitute-smoke.spec.ts",
] as const;

describe("SCIM provisioning band regression (private-beta invite substitute)", () => {
  it("keeps Vitest and live-api SCIM smoke guards on disk", () => {
    for (const relativePath of SCIM_PROVISIONING_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });
});
