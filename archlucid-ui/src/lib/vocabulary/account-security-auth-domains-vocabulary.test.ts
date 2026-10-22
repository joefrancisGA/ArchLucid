import { describe, expect, it } from "vitest";

import {
  ACCOUNT_SECURITY_AUTH_DOMAINS_COMPACT_LINE,
  ACCOUNT_SECURITY_AUTH_DOMAINS_DOMAINS_LINK,
  ACCOUNT_SECURITY_AUTH_DOMAINS_HEADING,
  ACCOUNT_SECURITY_AUTH_DOMAINS_SECURITY_LINK,
  ACCOUNT_SECURITY_AUTH_DOMAINS_WHY_TWO,
  buildAccountSecurityAuthDomainsVocabulary,
  resolveAccountSecurityAuthDomainsPeerLink,
} from "@/lib/vocabulary/account-security-auth-domains-vocabulary";
import { AUTH_DOMAINS_SETTINGS_CANONICAL_PATH } from "@/lib/auth-domains-settings-evidence-copy";
import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";

describe("account-security-auth-domains-vocabulary (TB-2293)", () => {
  it("explains account sign-in methods vs tenant auth domains", () => {
    const model = buildAccountSecurityAuthDomainsVocabulary();

    expect(model.heading).toBe(ACCOUNT_SECURITY_AUTH_DOMAINS_HEADING);
    expect(model.heading.toLowerCase()).toContain("sign-in methods");
    expect(model.heading.toLowerCase()).toContain("sign-in domains");
    expect(model.whyTwo).toBe(ACCOUNT_SECURITY_AUTH_DOMAINS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("sign-in methods");
    expect(model.whyTwo.toLowerCase()).toContain("domain");
    expect(model.compactLine).toBe(ACCOUNT_SECURITY_AUTH_DOMAINS_COMPACT_LINE);

    expect(model.accountSecurityLink).toEqual(ACCOUNT_SECURITY_AUTH_DOMAINS_SECURITY_LINK);
    expect(model.accountSecurityLink.label).toBe("Sign-in methods");
    expect(model.accountSecurityLink.href).toBe(ACCOUNT_SECURITY_PATH);
    expect(model.accountSecurityLink.href).toBe("/account/security");

    expect(model.authDomainsLink).toEqual(ACCOUNT_SECURITY_AUTH_DOMAINS_DOMAINS_LINK);
    expect(model.authDomainsLink.href).toBe(AUTH_DOMAINS_SETTINGS_CANONICAL_PATH);
    expect(model.authDomainsLink.href).toBe("/administration/auth-domains");
  });

  it("resolves the peer surface from account security and auth domains", () => {
    expect(resolveAccountSecurityAuthDomainsPeerLink("account-security")).toEqual(
      ACCOUNT_SECURITY_AUTH_DOMAINS_DOMAINS_LINK,
    );

    expect(resolveAccountSecurityAuthDomainsPeerLink("auth-domains")).toEqual(
      ACCOUNT_SECURITY_AUTH_DOMAINS_SECURITY_LINK,
    );
  });
});
