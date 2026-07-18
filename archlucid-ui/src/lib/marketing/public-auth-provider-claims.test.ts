import { afterEach, describe, expect, it } from "vitest";

import {
  formatPublicWorkSchoolProviderClaim,
  formatPublicWorkSchoolSignInSentence,
  isPublicGoogleWorkSchoolConfigured,
  resolvePublicWorkSchoolProviderLabels,
} from "@/lib/marketing/public-auth-provider-claims";

describe("public-auth-provider-claims", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY;
    delete process.env.NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID;
  });

  it("advertises Microsoft only when Google env is unset", () => {
    expect(isPublicGoogleWorkSchoolConfigured()).toBe(false);
    expect(resolvePublicWorkSchoolProviderLabels()).toEqual(["Microsoft"]);
    expect(formatPublicWorkSchoolProviderClaim()).toBe("Microsoft");
    expect(formatPublicWorkSchoolSignInSentence()).toMatch(/Microsoft,/);
    expect(formatPublicWorkSchoolSignInSentence().toLowerCase()).not.toContain("google");
  });

  it("includes Google when both public Google OIDC env vars are set", () => {
    process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY = "https://accounts.google.com";
    process.env.NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID = "client.apps.googleusercontent.com";

    expect(isPublicGoogleWorkSchoolConfigured()).toBe(true);
    expect(resolvePublicWorkSchoolProviderLabels()).toEqual(["Microsoft", "Google"]);
    expect(formatPublicWorkSchoolProviderClaim()).toBe("Microsoft or Google");
    expect(formatPublicWorkSchoolSignInSentence()).toMatch(/Google/);
  });
});
