import { afterEach, describe, expect, it, vi } from "vitest";

import { isSecureNowInTenantHostedOnlyPath } from "@/lib/product-line/securenow-hosting-route-blocked";

describe("SecureNow hosting route boundaries", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks direct billing visits in InTenant mode", () => {
    vi.stubEnv("NEXT_PUBLIC_SECURENOW_HOSTING", "InTenant");

    expect(isSecureNowInTenantHostedOnlyPath("/administration/billing")).toBe(true);
    expect(isSecureNowInTenantHostedOnlyPath("/administration/billing?tab=plans")).toBe(true);
  });

  it("leaves billing available to hosted SecureNow and leaves other administration routes alone", () => {
    expect(isSecureNowInTenantHostedOnlyPath("/administration/billing")).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_SECURENOW_HOSTING", "InTenant");

    expect(isSecureNowInTenantHostedOnlyPath("/administration/workspace-settings")).toBe(false);
  });
});
