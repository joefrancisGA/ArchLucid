import type { components } from "@/lib/openapi-schemas";
import { proxyJsonGet } from "@/lib/proxy-json-client";

type AdminIdentityProvidersPageBundleResponse = {
  readonly identityProviderDiagnostics: components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];
  readonly authConfigurationDiagnostics: components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];
  readonly oidcDiagnostics: components["schemas"]["AdminOidcDiagnosticsResponse"];
  readonly samlOperationalHealth: components["schemas"]["AdminSamlOperationalHealthResponse"];
};

export async function fetchIdentityProvidersPageBundle(): Promise<AdminIdentityProvidersPageBundleResponse> {
  return proxyJsonGet<AdminIdentityProvidersPageBundleResponse>(
    "/api/proxy/v1/admin/diagnostics/identity-providers-page-bundle",
    { cache: "no-store" },
  );
}

export type { AdminIdentityProvidersPageBundleResponse };
