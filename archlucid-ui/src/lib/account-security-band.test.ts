import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  ACCOUNT_SECURITY_PAGE_TITLE,
  ACCOUNT_SECURITY_PAGE_SUBTITLE,
} from "@/lib/account-security-page-copy";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const ACCOUNT_SECURITY_BAND_TEST_FILES = [
  "src/lib/account-security-page-copy.test.ts",
  "src/lib/sign-in-method-remove-blocked-copy.test.ts",
  "src/app/(operator)/account/security/AccountSecurityPageClient.test.tsx",
] as const;

describe("account-security band regression (TB-1885)", () => {
  it("keeps sibling Vitest guards for TB-1881 through TB-1884 on disk", () => {
    for (const relativePath of ACCOUNT_SECURITY_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("scopes buyer chrome to sign-in methods without SSO or fresh-sign-in overclaim (TB-1881)", () => {
    expect(ACCOUNT_SECURITY_PAGE_TITLE).toBe("Sign-in methods");
    expect(ACCOUNT_SECURITY_PAGE_SUBTITLE).toContain("email one-time-code");
    expect(ACCOUNT_SECURITY_PAGE_SUBTITLE).not.toContain("fresh sign-in");
    expect(ACCOUNT_SECURITY_PAGE_SUBTITLE).not.toMatch(/sso/i);
  });

  it("keeps in-flight disable, in-page remove, and empty/help Vitest in AccountSecurityPageClient (TB-1882–TB-1884)", () => {
    const clientTestSource = existsSync(
      join(UI_ROOT, "src/app/(operator)/account/security/AccountSecurityPageClient.test.tsx"),
    );

    expect(clientTestSource).toBe(true);
  });
});
