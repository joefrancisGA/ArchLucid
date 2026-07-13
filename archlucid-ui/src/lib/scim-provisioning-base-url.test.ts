import { describe, expect, it } from "vitest";

import { resolveScimBaseUrl, SCIM_PROXY_BASE_PATH } from "@/lib/scim-provisioning-base-url";

describe("scim-provisioning-base-url", () => {
  it("builds the customer-facing SCIM base URL from the UI origin", () => {
    expect(resolveScimBaseUrl("https://app.archlucid.example")).toBe(
      `https://app.archlucid.example${SCIM_PROXY_BASE_PATH}`,
    );
    expect(resolveScimBaseUrl("https://app.archlucid.example/")).toBe(
      `https://app.archlucid.example${SCIM_PROXY_BASE_PATH}`,
    );
  });
});
