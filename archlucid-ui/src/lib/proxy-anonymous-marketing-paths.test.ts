import { describe, expect, it } from "vitest";

import {
  isAnonymousMarketingProxyPath,
  isPublicAnonymousProxyPath,
} from "@/lib/proxy-anonymous-marketing-paths";

describe("isPublicAnonymousProxyPath", () => {
  it("includes pre-auth sign-in routing and email OTP paths", () => {
    expect(isPublicAnonymousProxyPath("v1/register")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/auth/routing/evaluate")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/auth/email-otp/challenge")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/auth/email-otp/verify")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/auth/invitations/validate")).toBe(true);
    expect(isAnonymousMarketingProxyPath("v1/register")).toBe(false);
  });

  it("keeps marketing paths anonymous while excluding operator routes", () => {
    expect(isPublicAnonymousProxyPath("v1/marketing/early-access")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/auth/bootstrap/status")).toBe(false);
    expect(isAnonymousMarketingProxyPath("v1/auth/routing/evaluate")).toBe(false);
  });

  it("includes anonymous health probes and post-registration trial-status", () => {
    expect(isPublicAnonymousProxyPath("health/ready")).toBe(true);
    expect(isPublicAnonymousProxyPath("health/live")).toBe(true);
    expect(isPublicAnonymousProxyPath("version")).toBe(true);
    expect(isPublicAnonymousProxyPath("v1/tenant/trial-status")).toBe(true);
    expect(isAnonymousMarketingProxyPath("health/ready")).toBe(false);
  });
});
