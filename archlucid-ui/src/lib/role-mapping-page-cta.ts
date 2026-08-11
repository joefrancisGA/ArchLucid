import {
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_EDIT_SAML,
  IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
} from "@/lib/identity-providers-settings-copy";
import type { components } from "@/lib/openapi-schemas";

type AdminAuthConfigurationDiagnosticsResponse =
  components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];

export type RoleMappingPageCta = {
  readonly label: string;
  readonly href: string;
};

export function resolveRoleMappingPrimaryCta(
  config: AdminAuthConfigurationDiagnosticsResponse | null,
): RoleMappingPageCta {
  if (
    config?.tenantIdentityProviderProtocol === "Saml"
    || config?.saml2Enabled === true
    || config?.samlRoleClaimSourcesConfigured === true
  ) {
    return {
      label: IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_EDIT_SAML,
      href: "/administration/identity-providers/saml",
    };
  }

  return {
    label: IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD,
    href: "/administration/identity/sso-wizard",
  };
}
