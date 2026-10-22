import { describe, expect, it } from "vitest";

import { resolveCloudProviderSummaryPrimaryCtaLabel } from "./resolve-cloud-provider-summary-primary-cta-label";

describe("resolveCloudProviderSummaryPrimaryCtaLabel (TB-1141)", () => {
  it("returns Configure when the provider is not configured", () => {
    expect(resolveCloudProviderSummaryPrimaryCtaLabel("Not configured")).toBe("Configure");
    expect(resolveCloudProviderSummaryPrimaryCtaLabel("")).toBe("Configure");
  });

  it("returns Open connection when the provider already has a connection", () => {
    expect(resolveCloudProviderSummaryPrimaryCtaLabel("Configured")).toBe("Open connection");
    expect(resolveCloudProviderSummaryPrimaryCtaLabel("Healthy")).toBe("Open connection");
  });
});
