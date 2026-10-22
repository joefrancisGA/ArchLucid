import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  labelForAuthDomainEnforcementMode,
  labelForAuthDomainVerificationStatus,
} from "@/lib/auth-domains-enum-labels";
import { AUTH_DOMAINS_AUTHENTICATION_HELP_CTA } from "@/lib/auth-domains-page-copy";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const AUTH_DOMAINS_BAND_TEST_FILES = [
  "src/lib/auth-domains-enum-labels.test.ts",
  "src/app/(operator)/administration/auth-domains/AuthDomainsPageClient.test.tsx",
] as const;

describe("auth-domains band regression (TB-1895)", () => {
  it("keeps sibling Vitest guards for TB-1891 through TB-1894 on disk", () => {
    for (const relativePath of AUTH_DOMAINS_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("humanizes verification and enforcement enums for buyer-visible labels (TB-1891)", () => {
    expect(labelForAuthDomainVerificationStatus("Verified")).toBe("Verified");
    expect(labelForAuthDomainVerificationStatus("VerificationPending")).toBe("Verification pending");
    expect(labelForAuthDomainEnforcementMode("SsoOptional")).toBe("SSO optional");
    expect(labelForAuthDomainEnforcementMode("SsoRequiredWithRecoveryException")).toBe(
      "SSO required with recovery",
    );
  });

  it("keeps authentication help CTA copy for empty/settings wayfinding (TB-1894)", () => {
    expect(AUTH_DOMAINS_AUTHENTICATION_HELP_CTA).toMatch(/authentication help/i);
  });

  it("keeps busy, in-page confirm, and empty-state Vitest in AuthDomainsPageClient (TB-1892–TB-1894)", () => {
    expect(
      existsSync(
        join(UI_ROOT, "src/app/(operator)/administration/auth-domains/AuthDomainsPageClient.test.tsx"),
      ),
    ).toBe(true);
  });
});
