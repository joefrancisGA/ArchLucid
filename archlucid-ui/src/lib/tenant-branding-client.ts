import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type {
  TenantBrandingDisplayContext,
  TenantBrandingPresentationPayload,
} from "@/types/tenant-branding-presentation";

export function shouldSkipTenantBrandingPresentationFetch(): boolean {
  return AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn();
}

export async function fetchTenantBrandingPresentation(
  context: TenantBrandingDisplayContext,
): Promise<TenantBrandingPresentationPayload | null> {
  if (shouldSkipTenantBrandingPresentationFetch()) {
    return null;
  }

  const search = new URLSearchParams({ context });

  try {
    const res = await fetch(
      `/api/proxy/v1/infra-evidence/branding/presentation?${search.toString()}`,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
    );

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as TenantBrandingPresentationPayload;
  } catch {
    return null;
  }
}

export function resolveTenantLogoProxyUrl(presentation: TenantBrandingPresentationPayload): string | null {
  if (presentation.logoContentPath) {
    return `/api/proxy/${presentation.logoContentPath}`;
  }

  if (presentation.logoHttpsUrl) {
    return presentation.logoHttpsUrl;
  }

  return null;
}
