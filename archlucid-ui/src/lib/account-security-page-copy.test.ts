import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ACCOUNT_SECURITY_AUTH_GATE_MESSAGE,
  ACCOUNT_SECURITY_BANNED_PAGE_COPY,
  ACCOUNT_SECURITY_PAGE_SUBTITLE,
  ACCOUNT_SECURITY_PAGE_TITLE,
  ACCOUNT_SECURITY_SELF_SETTINGS_DESCRIPTION,
} from "@/lib/account-security-page-copy";
import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const repoRoot = join(import.meta.dirname, "..", "..");

function readUiSource(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function accountSecurityHelpCopy(): string {
  const entry = contextualHelpForPathname("/administration/account-security");

  return [
    entry?.whatIsThisPage ?? "",
    entry?.whatToDoNext ?? "",
    entry?.whereToConfigurePrerequisite ?? "",
  ].join("\n");
}

describe("account-security-page-copy (TB-1881)", () => {
  it("scopes buyer chrome to sign-in methods without SSO or fresh-sign-in overclaim", () => {
    expect(ACCOUNT_SECURITY_PAGE_TITLE).toBe("Sign-in methods");
    expect(ACCOUNT_SECURITY_PAGE_SUBTITLE).toContain("email one-time-code");
    expect(ACCOUNT_SECURITY_PAGE_SUBTITLE).not.toContain("fresh sign-in");
    expect(ACCOUNT_SECURITY_SELF_SETTINGS_DESCRIPTION).not.toMatch(/sso/i);
  });

  it("keeps banned phrases off the account-security page client and catalog surfaces", () => {
    const sources = [
      readUiSource("src/app/(operator)/administration/account-security/AccountSecurityPageClient.tsx"),
      readUiSource("src/lib/self-settings-destinations.ts"),
      readUiSource("src/lib/account-security-settings-evidence-copy.ts"),
      readUiSource("src/lib/vocabulary/account-security-auth-domains-vocabulary.ts"),
      accountSecurityHelpCopy(),
      pageHelpTopicForPathname("/administration/account-security")?.label ?? "",
    ].join("\n");

    for (const banned of ACCOUNT_SECURITY_BANNED_PAGE_COPY) {
      expect(sources).not.toContain(banned);
    }

    expect(sources).toContain(ACCOUNT_SECURITY_PAGE_TITLE);
    expect(readUiSource("src/app/(operator)/administration/account-security/AccountSecurityPageClient.tsx")).toContain(
      "ACCOUNT_SECURITY_AUTH_REQUIRED_EMPTY_COMPACT",
    );
    expect(ACCOUNT_SECURITY_AUTH_GATE_MESSAGE).toContain("Sign-in methods");
  });
});
