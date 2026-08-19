import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_PAGE_CONTAINER } from "@/lib/design-tokens";

const SRC_ROOT = join(process.cwd(), "src");

/**
 * Settings-shaped page roots that must use {@link OperatorPageContainer} `settings` width.
 * Personal settings under `/account` share the width contract even though they are not admin pages.
 */
const SETTINGS_WIDTH_PAGE_ROOT_MODULES = [
  "app/(operator)/administration/developer/DeveloperSettingsPageClient.tsx",
  "app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient.tsx",
  "app/(operator)/account/security/AccountSecurityPageClient.tsx",
  "app/(operator)/administration/api-keys/_sections/ApiKeysSettingsPageClient.tsx",
  "app/(operator)/administration/api-keys/_sections/ApiKeysSettingsRestrictedState.tsx",
  "app/(operator)/administration/auth-domains/AuthDomainsPageClient.tsx",
  "app/(operator)/account/preferences/_sections/PreferencesSettingsPageView.tsx",
  "app/(operator)/administration/notifications/_sections/NotificationPreferenceCenterPageView.tsx",
  "app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient.tsx",
  "app/(operator)/administration/baseline/BaselineSettingsClient.tsx",
  "app/(operator)/administration/workspace-settings/_sections/TenantSettingsPageView.tsx",
  "app/(operator)/administration/workspace-settings/_sections/TenantSettingsRestrictedState.tsx",
  "app/(operator)/administration/workspace-settings/recycle-bin/_sections/ProjectsRecycleBinPage.tsx",
  "app/(operator)/administration/model-governance/page.tsx",
  "app/(operator)/administration/identity-providers/_sections/IdentityProvidersSettingsShell.tsx",
  "app/(operator)/administration/identity-providers/_sections/IdentityProvidersSettingsRestrictedState.tsx",
] as const;

const BANNED_PAGE_ROOT_WIDTH_PATTERNS = [
  /className="w-full max-w-/,
  /className=\{cn\("w-full max-w-/,
] as const;

function readSrcModule(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), "utf8");
}

describe("administration page container width (P0-4)", () => {
  it("exposes the harmonized administration settings width token", () => {
    expect(OPERATOR_PAGE_CONTAINER.variant.settings).toBe("w-full max-w-[62rem]");
  });

  it.each(SETTINGS_WIDTH_PAGE_ROOT_MODULES)(
    "%s uses OperatorPageContainer settings variant without hardcoded page-root max-w",
    (modulePath) => {
      const source = readSrcModule(modulePath);

      expect(source).toContain('variant="settings"');
      expect(source).toContain("OperatorPageContainer");

      for (const banned of BANNED_PAGE_ROOT_WIDTH_PATTERNS) {
        expect(source).not.toMatch(banned);
      }
    },
  );
});
