import {
  IDENTITY_PROVIDERS_ACTION_OPEN_IDENTITY_DIAGNOSTICS,
  IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF,
  IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_HREF,
  IDENTITY_PROVIDERS_OIDC_ACTION_VALIDATE_DISCOVERY,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
  IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
} from "@/lib/identity-providers-settings-copy";
import type { components } from "@/lib/openapi-schemas";

type AdminOidcDiagnosticsResponse = components["schemas"]["AdminOidcDiagnosticsResponse"];

export type OidcPageCta = {
  readonly label: string;
  readonly href: string;
};

export function oidcPageNeedsDiscoveryReview(
  oidc: AdminOidcDiagnosticsResponse | null,
  overviewOidcStatus: string,
): boolean {
  if (oidc?.discoveryAttempted === false) {
    return true;
  }

  if (oidc?.discoverySucceeded === false) {
    return true;
  }

  if (overviewOidcStatus === IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW) {
    return true;
  }

  if (overviewOidcStatus === IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED) {
    return true;
  }

  return false;
}

export function resolveOidcPagePrimaryCta(
  oidc: AdminOidcDiagnosticsResponse | null,
  overviewOidcStatus: string,
): OidcPageCta {
  if (oidcPageNeedsDiscoveryReview(oidc, overviewOidcStatus)) {
    return {
      label: IDENTITY_PROVIDERS_OIDC_ACTION_VALIDATE_DISCOVERY,
      href: IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_HREF,
    };
  }

  return {
    label: IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
    href: "/administration/identity/sso-wizard",
  };
}

export function resolveOidcPageSecondaryCta(
  oidc: AdminOidcDiagnosticsResponse | null,
  overviewOidcStatus: string,
): OidcPageCta {
  if (oidcPageNeedsDiscoveryReview(oidc, overviewOidcStatus)) {
    return {
      label: IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
      href: "/administration/identity/sso-wizard",
    };
  }

  return {
    label: IDENTITY_PROVIDERS_ACTION_OPEN_IDENTITY_DIAGNOSTICS,
    href: IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF,
  };
}
