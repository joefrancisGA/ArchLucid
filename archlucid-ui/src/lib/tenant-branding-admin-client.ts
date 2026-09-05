import { proxyJsonGet, proxyJsonPost, proxyJsonPut } from "@/lib/proxy-json-client";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type {
  BrandAssetResponse,
  BrandAssetType,
  TenantBrandingActivateResponse,
  TenantBrandingAdminState,
  TenantBrandingDraftPutRequest,
} from "@/types/tenant-branding-admin";

const ADMIN_STATE_PATH = "/api/proxy/v1/infra-evidence/branding/admin";
const ASSET_UPLOAD_PATH = "/api/proxy/v1/infra-evidence/branding/assets";

export async function fetchTenantBrandingAdminState(): Promise<TenantBrandingAdminState> {
  return proxyJsonGet<TenantBrandingAdminState>(ADMIN_STATE_PATH);
}

export async function saveTenantBrandingDraft(
  body: TenantBrandingDraftPutRequest,
): Promise<TenantBrandingAdminState> {
  return proxyJsonPut<TenantBrandingAdminState>(`${ADMIN_STATE_PATH}/draft`, body);
}

export async function activateTenantBrandingDraft(): Promise<TenantBrandingActivateResponse> {
  return proxyJsonPost<TenantBrandingActivateResponse>(`${ADMIN_STATE_PATH}/activate`, {});
}

export async function revertTenantBrandingToDefaults(): Promise<TenantBrandingAdminState> {
  return proxyJsonPost<TenantBrandingAdminState>(`${ADMIN_STATE_PATH}/revert`, {});
}

export function resolveBrandAssetContentUrl(assetId: string | null | undefined): string | null {
  const trimmed = assetId?.trim();

  if (trimmed == null || trimmed.length === 0) {
    return null;
  }

  return `/api/proxy/v1/infra-evidence/branding/assets/${trimmed}/content`;
}

export async function uploadBrandAsset(file: File, assetType: BrandAssetType): Promise<BrandAssetResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("assetType", assetType);

  let response: Response;

  try {
    response = await fetch(
      ASSET_UPLOAD_PATH,
      mergeRegistrationScopeForProxy({
        method: "POST",
        body: formData,
        credentials: "include",
      }),
    );
  } catch (error: unknown) {
    throw toApiLoadFailure(error);
  }

  const text = await response.text();

  if (!response.ok) {
    throw toApiLoadFailure(new Error(text || "Brand asset upload failed."));
  }

  return JSON.parse(text) as BrandAssetResponse;
}
