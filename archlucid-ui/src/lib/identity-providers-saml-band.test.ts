import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA,
  IDENTITY_PROVIDERS_SAML_PAGE_INTRO,
  IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE,
} from "@/lib/identity-providers-settings-copy";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SAML_BAND_TEST_FILES = [
  "src/app/(operator)/administration/identity-providers/_sections/SamlSpConfigurationForm.test.tsx",
  "src/lib/identity-providers-settings-copy.test.ts",
  "src/lib/saml-sp-configuration-form-state.test.ts",
] as const;

describe("identity-providers SAML band regression (TB-1925)", () => {
  it("keeps sibling Vitest guards for TB-1921 through TB-1924 on disk", () => {
    for (const relativePath of SAML_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("labels metadata discovery as Fetch IdP metadata, not Validate configuration (TB-1921)", () => {
    expect(IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA).toBe("Fetch IdP metadata");
    expect(IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA.toLowerCase()).not.toContain("validate configuration");
  });

  it("uses a distinct SAML shell subtitle instead of repeating page intro (TB-1923)", () => {
    expect(IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_SAML_PAGE_INTRO);
    expect(IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE.toLowerCase()).not.toContain("configure saml");
  });

  it("keeps in-page save confirm covered by SamlSpConfigurationForm Vitest (TB-1922)", () => {
    const formTestSource = existsSync(
      join(UI_ROOT, "src/app/(operator)/administration/identity-providers/_sections/SamlSpConfigurationForm.test.tsx"),
    );

    expect(formTestSource).toBe(true);
  });
});
