import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE,
  IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE,
  IDENTITY_PROVIDERS_PAGE_SUBTITLE,
} from "@/lib/identity-providers-settings-copy";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const DIAGNOSTICS_BAND_TEST_FILES = [
  "src/app/(operator)/administration/identity-providers/_sections/IdentityProvidersDiagnosticsPageView.test.tsx",
  "src/lib/identity-providers-settings-copy.test.ts",
  "src/lib/identity-provider-probe-status-presentation.test.ts",
  "src/app/(operator)/administration/identity-providers/_sections/IdentityProviderHealthStrip.test.tsx",
  "src/app/(operator)/administration/identity-providers/_sections/OidcDiagnosticsStrip.test.tsx",
] as const;

describe("identity-providers diagnostics band regression (TB-1910)", () => {
  it("keeps sibling Vitest guards for TB-1906 through TB-1909 on disk", () => {
    for (const relativePath of DIAGNOSTICS_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps diagnostics-specific shell subtitle instead of configure workspace intro (TB-1906)", () => {
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE).toBe("Identity diagnostics");
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE.toLowerCase()).toContain("validate");
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE).not.toBe(IDENTITY_PROVIDERS_PAGE_SUBTITLE);
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE.toLowerCase()).not.toContain("configure workspace");
  });

  it("keeps bundle loading copy for pending diagnostics strips (TB-1909)", () => {
    expect(IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING).toMatch(/loading identity diagnostics/i);
  });

  it("keeps probe StatusTag presentation covered by sibling Vitest (TB-1907, TB-1908)", () => {
    expect(
      existsSync(join(UI_ROOT, "src/lib/identity-provider-probe-status-presentation.test.ts")),
    ).toBe(true);
    expect(
      existsSync(
        join(
          UI_ROOT,
          "src/app/(operator)/administration/identity-providers/_sections/IdentityProvidersDiagnosticsPageView.test.tsx",
        ),
      ),
    ).toBe(true);
  });
});
