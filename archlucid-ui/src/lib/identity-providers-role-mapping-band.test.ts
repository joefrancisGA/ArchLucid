import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_HELPER,
  IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_INTRO,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE,
} from "@/lib/identity-providers-settings-copy";
import { resolveRoleMappingPrimaryCta } from "@/lib/role-mapping-page-cta";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const ROLE_MAPPING_BAND_TEST_FILES = [
  "src/app/(operator)/administration/identity-providers/_sections/IdentityProvidersRoleMappingPageView.test.tsx",
  "src/lib/role-mapping-page-cta.test.ts",
  "src/lib/identity-providers-settings-copy.test.ts",
  "src/lib/identity-provider-probe-status-presentation.test.ts",
] as const;

describe("identity-providers role mapping band regression (TB-1920)", () => {
  it("keeps sibling Vitest guards for TB-1916 through TB-1919 on disk", () => {
    for (const relativePath of ROLE_MAPPING_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps status-hub shell title and intro honesty (TB-1916)", () => {
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE).toBe("Role mapping status");
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_INTRO.toLowerCase()).toContain("review");
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_INTRO.toLowerCase()).not.toContain("map identity provider");
  });

  it("keeps distinct shell subtitle without configure-workspace duplication (TB-1917)", () => {
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_INTRO);
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE.toLowerCase()).not.toContain("configure workspace");
  });

  it("labels mapping examples as illustrative (TB-1918)", () => {
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL.toLowerCase()).toContain("illustrative");
    expect(IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_HELPER.toLowerCase()).toContain("not your tenant");
  });

  it("routes SAML tenants to the SAML editor primary CTA (TB-1919)", () => {
    const cta = resolveRoleMappingPrimaryCta({ tenantIdentityProviderProtocol: "Saml" });

    expect(cta.href).toContain("/administration/identity-providers/saml");
  });
});
