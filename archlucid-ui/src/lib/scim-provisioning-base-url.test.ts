import { describe, expect, it } from "vitest";

import { resolveScimBaseUrl, classifyScimBaseUrl, SCIM_PROXY_BASE_PATH } from "@/lib/scim-provisioning-base-url";

describe("scim-provisioning-base-url", () => {
  it("builds the customer-facing SCIM base URL from the UI origin", () => {
    expect(resolveScimBaseUrl("https://app.archlucid.example")).toBe(
      `https://app.archlucid.example${SCIM_PROXY_BASE_PATH}`,
    );
    expect(resolveScimBaseUrl("https://app.archlucid.example/")).toBe(
      `https://app.archlucid.example${SCIM_PROXY_BASE_PATH}`,
    );
  });

  it("flags loopback and non-HTTPS origins for external reachability warnings", () => {
    expect(classifyScimBaseUrl("http://localhost:3000")).toEqual({
      url: `http://localhost:3000${SCIM_PROXY_BASE_PATH}`,
      isLoopbackHost: true,
      isNonHttpsScheme: true,
      requiresExternalReachabilityWarning: true,
    });

    expect(classifyScimBaseUrl("https://app.archlucid.example")).toEqual({
      url: `https://app.archlucid.example${SCIM_PROXY_BASE_PATH}`,
      isLoopbackHost: false,
      isNonHttpsScheme: false,
      requiresExternalReachabilityWarning: false,
    });
  });
});
