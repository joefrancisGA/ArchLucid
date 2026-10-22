import { describe, expect, it } from "vitest";

import { isCloudProviderSummaryConfigured } from "./is-cloud-provider-summary-configured";

describe("isCloudProviderSummaryConfigured (TB-1143)", () => {
  it("returns false for empty or Not configured status", () => {
    expect(isCloudProviderSummaryConfigured("")).toBe(false);
    expect(isCloudProviderSummaryConfigured("Not configured")).toBe(false);
    expect(isCloudProviderSummaryConfigured("  not configured  ")).toBe(false);
  });

  it("returns true for any configured connection status", () => {
    expect(isCloudProviderSummaryConfigured("Configured")).toBe(true);
    expect(isCloudProviderSummaryConfigured("Healthy")).toBe(true);
  });
});
