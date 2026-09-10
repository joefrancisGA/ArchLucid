import { describe, expect, it } from "vitest";

import {
  isAnonymousMarketingProxyPath,
  isPublicAnonymousProxyPath,
} from "@/lib/proxy-anonymous-marketing-paths";

describe("isPublicAnonymousProxyPath", () => {
  it("includes pre-auth sign-in routing and email OTP paths", () => {
    expect(isPublicAnonymousProxyPath("v1/auth/routing/evaluate")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/auth/email-otp/challenge")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/auth/email-otp/verify")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/auth/invitations/validate")).toBe(true);
  });

  it("keeps marketing paths anonymous while excluding operator routes", () => {
    expect(isPublicAnonymousProxyPath("v1/marketing/early-access")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/auth/bootstrap/status")).toBe(false);
    expect(isAnonymousMarketingProxyPath("v1/auth/routing/evaluate")).toBe(false);
  });
});
