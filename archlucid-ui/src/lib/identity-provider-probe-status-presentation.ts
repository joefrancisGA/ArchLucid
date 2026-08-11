import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  IDENTITY_PROVIDERS_DISCOVERY_STATUS_NOT_ATTEMPTED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
  IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
} from "@/lib/identity-providers-settings-copy";

export type IdentityProviderStatusPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export function identityProviderProbeStatusPresentation(
  status: string | undefined,
): IdentityProviderStatusPresentation {
  switch (status) {
    case "Healthy":
      return { kind: "ready", label: IDENTITY_PROVIDERS_STATUS_HEALTHY };
    case "Degraded":
    case "Unreachable":
      return { kind: "needs-attention", label: IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW };
    case "NotApplicable":
      return { kind: "neutral", label: IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE };
    default:
      return { kind: "neutral", label: IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED };
  }
}

export type OidcDiscoveryStatusLabel = "Not attempted" | "Healthy" | "Unreachable";

export function oidcDiscoveryStatusLabelFromPayload(
  payload: { readonly discoveryAttempted?: boolean; readonly discoverySucceeded?: boolean | null } | null | undefined,
): OidcDiscoveryStatusLabel | null {
  if (!payload) {
    return null;
  }

  if (payload.discoverySucceeded === false) {
    return "Unreachable";
  }

  if (!payload.discoveryAttempted) {
    return "Not attempted";
  }

  if (payload.discoverySucceeded === true) {
    return "Healthy";
  }

  return "Unreachable";
}

export function oidcDiscoveryStatusPresentation(
  status: OidcDiscoveryStatusLabel,
): IdentityProviderStatusPresentation {
  switch (status) {
    case "Healthy":
      return { kind: "ready", label: IDENTITY_PROVIDERS_STATUS_HEALTHY };
    case "Unreachable":
      return { kind: "blocked", label: IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW };
    case "Not attempted":
      return { kind: "neutral", label: IDENTITY_PROVIDERS_DISCOVERY_STATUS_NOT_ATTEMPTED };
    default: {
      const _exhaustive: never = status;

      return _exhaustive;
    }
  }
}

export function oidcPageDiscoveryStatusPresentation(
  oidc: { readonly discoveryAttempted?: boolean; readonly discoverySucceeded?: boolean | null } | null | undefined,
  overviewOidcStatus: string,
): IdentityProviderStatusPresentation {
  if (overviewOidcStatus === IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE) {
    return identityProviderProbeStatusPresentation("NotApplicable");
  }

  const discoveryLabel = oidcDiscoveryStatusLabelFromPayload(oidc);

  if (discoveryLabel !== null) {
    return oidcDiscoveryStatusPresentation(discoveryLabel);
  }

  return identityProviderProbeStatusPresentation(undefined);
}
