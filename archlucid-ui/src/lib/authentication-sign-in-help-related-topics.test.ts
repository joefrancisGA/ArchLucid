import { describe, expect, it } from "vitest";

import {
  AUTHENTICATION_SIGN_IN_HELP_BANNED_RELATED_HELP_SLUGS,
  AUTHENTICATION_SIGN_IN_HELP_RELATED_TOPICS,
  AUTHENTICATION_SIGN_IN_HELP_SSO_SETUP_LINK,
  authenticationSignInHelpRelatedTopics,
  relatedTopicsContainBannedAuthenticationHelpSlug,
} from "@/lib/authentication-sign-in-help-related-topics";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

describe("authenticationSignInHelpRelatedTopics (TB-1617)", () => {
  it("caps Related at two product-safe guides without enterprise-onboarding", () => {
    const topics = authenticationSignInHelpRelatedTopics();

    expect(topics).toHaveLength(2);
    expect(topics).toEqual([...AUTHENTICATION_SIGN_IN_HELP_RELATED_TOPICS]);
    expect(relatedTopicsContainBannedAuthenticationHelpSlug(topics)).toBe(false);
    expect(topics.map((topic) => topic.href)).not.toContain(inAppHelpHref("enterprise-onboarding"));
  });

  it("routes SSO setup to the identity SSO wizard instead of enterprise-onboarding help", () => {
    expect(AUTHENTICATION_SIGN_IN_HELP_SSO_SETUP_LINK.href).toBe("/administration/identity/sso-wizard");
    expect(AUTHENTICATION_SIGN_IN_HELP_SSO_SETUP_LINK.href).not.toContain("enterprise-onboarding");
  });

  it("documents banned related slugs for drift review", () => {
    expect(AUTHENTICATION_SIGN_IN_HELP_BANNED_RELATED_HELP_SLUGS).toContain("enterprise-onboarding");
  });
});
