import { describe, expect, it } from "vitest";

import {
  identityProviderCustomerStatusPresentation,
  identityProviderProbeStatusPresentation,
  oidcDiscoveryStatusLabelFromPayload,
  oidcDiscoveryStatusPresentation,
  oidcPageDiscoveryStatusPresentation,
} from "@/lib/identity-provider-probe-status-presentation";
import {
  IDENTITY_PROVIDERS_DISCOVERY_STATUS_NOT_ATTEMPTED,
  IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED,
  IDENTITY_PROVIDERS_STATUS_ENABLED,
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

  it("humanizes identity provider customer statuses for buyer-facing StatusTag labels (TB-1918)", () => {
    expect(identityProviderCustomerStatusPresentation(IDENTITY_PROVIDERS_STATUS_ENABLED)).toEqual({
      kind: "ready",
      label: IDENTITY_PROVIDERS_STATUS_ENABLED,
    });
    expect(identityProviderCustomerStatusPresentation(IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW)).toEqual({
      kind: "needs-attention",
      label: IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
    });
    expect(identityProviderCustomerStatusPresentation(IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED)).toEqual({
      kind: "blocked",
      label: IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED,
    });
    expect(identityProviderCustomerStatusPresentation(IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED)).toEqual({
      kind: "neutral",
      label: IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
    });
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

  it("derives OIDC discovery labels from diagnostics payload (TB-1913)", () => {
    expect(oidcDiscoveryStatusLabelFromPayload(null)).toBeNull();
    expect(oidcDiscoveryStatusLabelFromPayload({ discoveryAttempted: false })).toBe("Not attempted");
    expect(
      oidcDiscoveryStatusLabelFromPayload({ discoveryAttempted: false, discoverySucceeded: false }),
    ).toBe("Unreachable");
    expect(
      oidcDiscoveryStatusLabelFromPayload({ discoveryAttempted: true, discoverySucceeded: true }),
    ).toBe("Healthy");
    expect(
      oidcDiscoveryStatusLabelFromPayload({ discoveryAttempted: true, discoverySucceeded: false }),
    ).toBe("Unreachable");
  });

  it("resolves OIDC page discovery presentation from payload or overview fallback (TB-1913)", () => {
    expect(
      oidcPageDiscoveryStatusPresentation(
        { discoveryAttempted: true, discoverySucceeded: true },
        "Healthy",
      ),
    ).toEqual({
      kind: "ready",
      label: IDENTITY_PROVIDERS_STATUS_HEALTHY,
    });
    expect(
      oidcPageDiscoveryStatusPresentation(
        { discoveryAttempted: false, discoverySucceeded: false },
        "Healthy",
      ),
    ).toEqual({
      kind: "blocked",
      label: IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
    });
    expect(
      oidcPageDiscoveryStatusPresentation(
        { discoveryAttempted: false },
        IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
      ),
    ).toEqual({
      kind: "neutral",
      label: IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
    });
    expect(oidcPageDiscoveryStatusPresentation(null, "Not configured")).toEqual({
      kind: "neutral",
      label: IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
    });
  });
});
