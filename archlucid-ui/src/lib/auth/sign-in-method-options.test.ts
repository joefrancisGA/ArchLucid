import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveSignInMethodOptions } from "@/lib/auth/sign-in-method-options";

describe("resolveSignInMethodOptions", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
    process.env.NEXT_PUBLIC_ARCHLUCID_AUTH_MODE = "jwt";
    process.env.NEXT_PUBLIC_OIDC_AUTHORITY = "https://login.microsoftonline.com/tenant/v2.0";
    process.env.NEXT_PUBLIC_OIDC_CLIENT_ID = "spa-client";
    process.env.NEXT_PUBLIC_ARCHLUCID_EMAIL_OTP_ENABLED = "true";
    delete process.env.NEXT_PUBLIC_ARCHLUCID_SUPPLEMENTAL_SIGN_IN_PROVIDERS;
    delete process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY;
  });

  afterEach(() => {
    process.env = envBackup;
    vi.unstubAllGlobals();
  });

  it("offers work/school and email code when both are configured", () => {
    const options = resolveSignInMethodOptions();

    expect(options.workSchool).toBe(true);
    expect(options.emailCode).toBe(true);
  });

  it("does not advertise Microsoft supplemental when not explicitly enabled", () => {
    const options = resolveSignInMethodOptions();

    expect(options.supplementalProviders).toEqual([]);
  });

  it("advertises Microsoft supplemental only when enabled and authority matches", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SUPPLEMENTAL_SIGN_IN_PROVIDERS = "microsoft";

    const options = resolveSignInMethodOptions();

    expect(options.supplementalProviders).toEqual(["microsoft"]);
  });

  it("does not advertise Google supplemental without google authority env", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SUPPLEMENTAL_SIGN_IN_PROVIDERS = "google";

    const options = resolveSignInMethodOptions();

    expect(options.supplementalProviders).toEqual([]);
  });

  it("advertises Google supplemental when google authority is configured", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SUPPLEMENTAL_SIGN_IN_PROVIDERS = "google";
    process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY = "https://accounts.google.com";

    const options = resolveSignInMethodOptions();

    expect(options.supplementalProviders).toEqual(["google"]);
  });

  it("does not advertise Microsoft supplemental for substring bypass authorities", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SUPPLEMENTAL_SIGN_IN_PROVIDERS = "microsoft";
    process.env.NEXT_PUBLIC_OIDC_AUTHORITY =
      "https://evil.example/login.microsoftonline.com/tenant/v2.0";

    const options = resolveSignInMethodOptions();

    expect(options.supplementalProviders).toEqual([]);
  });

  it("does not advertise Google supplemental for substring bypass authorities", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_SUPPLEMENTAL_SIGN_IN_PROVIDERS = "google";
    process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY = "https://evil.com/?x=accounts.google.com";

    const options = resolveSignInMethodOptions();

    expect(options.supplementalProviders).toEqual([]);
  });

  it("hides work/school when auth mode is not jwt", () => {
    process.env.NEXT_PUBLIC_ARCHLUCID_AUTH_MODE = "development-bypass";
    delete process.env.NEXT_PUBLIC_OIDC_CLIENT_ID;

    const options = resolveSignInMethodOptions();

    expect(options.workSchool).toBe(false);
    expect(options.emailCode).toBe(true);
  });
});
