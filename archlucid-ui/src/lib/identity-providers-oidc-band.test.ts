import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_HREF,
  IDENTITY_PROVIDERS_OIDC_LOADING,
  IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_OIDC_PAGE_TITLE,
  IDENTITY_PROVIDERS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
} from "@/lib/identity-providers-settings-copy";
import { resolveOidcPagePrimaryCta } from "@/lib/oidc-page-cta";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const OIDC_BAND_TEST_FILES = [
  "src/app/(operator)/administration/identity-providers/_sections/IdentityProvidersOidcPageView.test.tsx",
  "src/lib/identity-providers-settings-copy.test.ts",
  "src/lib/identity-provider-probe-status-presentation.test.ts",
  "src/lib/oidc-page-cta.test.ts",
] as const;

describe("identity-providers OIDC band regression (TB-1915)", () => {
  it("keeps sibling Vitest guards for TB-1911 through TB-1914 on disk", () => {
    for (const relativePath of OIDC_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps status framing for OIDC shell title instead of in-page configuration (TB-1911)", () => {
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_TITLE).toBe("OIDC/JWT status");
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_TITLE.toLowerCase()).not.toContain("configuration");
  });

  it("uses a distinct OIDC shell subtitle instead of configure workspace intro (TB-1912)", () => {
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_PAGE_SUBTITLE);
    expect(IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE.toLowerCase()).not.toContain("configure workspace");
  });

  it("keeps loading copy for pending OIDC diagnostics payload (TB-1914)", () => {
    expect(IDENTITY_PROVIDERS_OIDC_LOADING).toMatch(/loading oidc\/jwt status/i);
  });

  it("routes needs-review tenants to diagnostics OIDC section primary CTA (TB-1914)", () => {
    const cta = resolveOidcPagePrimaryCta(null, IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW);

    expect(cta.href).toBe(IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_HREF);
  });

  it("routes healthy tenants to SSO wizard primary CTA (TB-1914)", () => {
    const cta = resolveOidcPagePrimaryCta(
      {
        authMode: "JwtBearer",
        configuredAuthority: "https://login.example.com/",
        configuredAudience: "api://demo",
        discoveryAttempted: true,
        discoverySucceeded: true,
        openIdConfigurationUrl: "https://login.example.com/.well-known/openid-configuration",
      },
      "Healthy",
    );

    expect(cta.label).toBe(IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD);
  });
});
