import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { components } from "@/lib/openapi-schemas";

export type TenantIdentityProviderConfigurationRecord =
  components["schemas"]["TenantIdentityProviderConfigurationRecord"];
export type IdentityProviderDiscoverResponse = components["schemas"]["IdentityProviderDiscoverResponse"];
export type IdentityProviderActivateResponse = components["schemas"]["IdentityProviderActivateResponse"];

export type IdentityProviderActivateBody = {
  protocol: "saml";
  issuerUri: string;
  metadataXml?: string | null;
  claimMapping: {
    roleClaimName: string;
    mappings: { idpValue: string; archLucidRole: string }[];
    customGroupClaimRegex?: string | null;
  };
  keyVaultSecretName?: string | null;
};

type PostJsonResult<T> = { ok: true; status: number; data?: T } | { ok: false; status: number; text?: string };

async function postAdminIdentityJson<T>(path: string, body: unknown): Promise<PostJsonResult<T>> {
  const opts = mergeRegistrationScopeForProxy({
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const res = await fetch(path, opts);
  const text = await res.text();

  if (!res.ok) {
    return { ok: false, status: res.status, text };
  }

  return { ok: true, status: res.status, data: text ? (JSON.parse(text) as T) : undefined };
}

/** GET /v1/admin/identity/configuration — current tenant SSO row when configured. */
export async function fetchTenantIdentityProviderConfiguration(): Promise<
  TenantIdentityProviderConfigurationRecord | null
> {
  const opts = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" });
  const res = await fetch("/api/proxy/v1/admin/identity/configuration", opts);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Identity configuration unavailable (HTTP ${res.status}).`);
  }

  return (await res.json()) as TenantIdentityProviderConfigurationRecord;
}

/** POST /v1/admin/identity/discover — fetch IdP issuer and claim hints from metadata URL. */
export async function discoverIdentityProviderMetadata(
  protocol: "saml",
  metadataUrl: string,
): Promise<IdentityProviderDiscoverResponse> {
  const result = await postAdminIdentityJson<IdentityProviderDiscoverResponse>(
    "/api/proxy/v1/admin/identity/discover",
    { protocol, metadataUrl },
  );

  if (!result.ok) {
    throw new Error(result.text ?? `Discovery failed (HTTP ${result.status}).`);
  }

  return result.data ?? {};
}

/** POST /v1/admin/identity/activate — persist tenant SAML configuration (no host ArchLucidAuth mutation). */
export async function activateTenantSamlIdentityProvider(
  body: IdentityProviderActivateBody,
): Promise<IdentityProviderActivateResponse> {
  const result = await postAdminIdentityJson<IdentityProviderActivateResponse>(
    "/api/proxy/v1/admin/identity/activate",
    body,
  );

  if (!result.ok) {
    throw new Error(result.text ?? `Save failed (HTTP ${result.status}).`);
  }

  return result.data ?? {};
}
