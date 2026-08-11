import { describe, expect, it } from "vitest";

import {
  identityProviderProbeStatusPresentation,
  oidcDiscoveryStatusPresentation,
} from "@/lib/identity-provider-probe-status-presentation";
import {
  IDENTITY_PROVIDERS_DISCOVERY_STATUS_NOT_ATTEMPTED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
  IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
} from "@/lib/identity-providers-settings-copy";

describe("identity-provider-probe-status-presentation", () => {
  it("humanizes identity provider probe statuses for buyer-facing StatusTag labels (TB-1907)", () => {
    expect(identityProviderProbeStatusPresentation("Healthy")).toEqual({
      kind: "ready",
      label: IDENTITY_PROVIDERS_STATUS_HEALTHY,
    });
    expect(identityProviderProbeStatusPresentation("Degraded")).toEqual({
      kind: "needs-attention",
      label: IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
    });
    expect(identityProviderProbeStatusPresentation("Unreachable")).toEqual({
      kind: "needs-attention",
      label: IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
    });
    expect(identityProviderProbeStatusPresentation("NotApplicable")).toEqual({
      kind: "neutral",
      label: IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
    });
    expect(identityProviderProbeStatusPresentation(undefined)).toEqual({
      kind: "neutral",
      label: IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
    });

    expect(IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE).not.toContain("NotApplicable");
  });

  it("humanizes OIDC discovery statuses for buyer-facing StatusTag labels (TB-1907)", () => {
    expect(oidcDiscoveryStatusPresentation("Healthy")).toEqual({
      kind: "ready",
      label: IDENTITY_PROVIDERS_STATUS_HEALTHY,
    });
    expect(oidcDiscoveryStatusPresentation("Unreachable")).toEqual({
      kind: "blocked",
      label: IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
    });
    expect(oidcDiscoveryStatusPresentation("Not attempted")).toEqual({
      kind: "neutral",
      label: IDENTITY_PROVIDERS_DISCOVERY_STATUS_NOT_ATTEMPTED,
    });
  });
});
