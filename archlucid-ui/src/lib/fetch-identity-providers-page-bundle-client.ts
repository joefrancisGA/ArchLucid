import type { components } from "@/lib/openapi-schemas";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type AdminIdentityProvidersPageBundleResponse = {
  readonly identityProviderDiagnostics: components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];
  readonly authConfigurationDiagnostics: components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];
  readonly oidcDiagnostics: components["schemas"]["AdminOidcDiagnosticsResponse"];
  readonly samlOperationalHealth: components["schemas"]["AdminSamlOperationalHealthResponse"];
};

export async function fetchIdentityProvidersPageBundle(): Promise<AdminIdentityProvidersPageBundleResponse> {
  const response = await fetch("/api/proxy/v1/admin/diagnostics/identity-providers-page-bundle", {
    ...mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
  });

  if (!response.ok) {
    throw Object.assign(new Error("Identity providers page bundle unavailable"), { status: response.status });
  }

  return (await response.json()) as AdminIdentityProvidersPageBundleResponse;
}

export type { AdminIdentityProvidersPageBundleResponse };
