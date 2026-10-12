import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_SECURENOW_HOSTING_MODE,
  isSecureNowInTenantHosting,
  resolveSecureNowHostingMode,
} from "@/lib/product-line/securenow-hosting-mode";

describe("SecureNow hosting mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to ArchLucid-hosted when configuration is missing or unknown", () => {
    expect(resolveSecureNowHostingMode(undefined)).toBe(DEFAULT_SECURENOW_HOSTING_MODE);
    expect(resolveSecureNowHostingMode("unknown")).toBe(DEFAULT_SECURENOW_HOSTING_MODE);
    expect(isSecureNowInTenantHosting("unknown")).toBe(false);
  });

  it("accepts the deployment spelling for in-tenant hosting", () => {
    expect(resolveSecureNowHostingMode("InTenant")).toBe("in-tenant");
    expect(resolveSecureNowHostingMode("in-tenant")).toBe("in-tenant");
    expect(isSecureNowInTenantHosting("in-tenant")).toBe(true);
  });

  it("does not read hosting mode from a browser-controlled input", () => {
    vi.stubEnv("NEXT_PUBLIC_SECURENOW_HOSTING", "in-tenant");

    expect(resolveSecureNowHostingMode()).toBe("in-tenant");
  });
});
