import type { components } from "@/lib/api-types/schemas.generated";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { architectureInventoryBindingBlockedReason } from "@/lib/architecture/architecture-inventory-binding-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiDelete, apiPostJson } from "./http";

const ARCHITECTURES_BASE = "/v1/architectures";

export type ArchitectureInventoryBindingResponse =
  components["schemas"]["ArchitectureInventoryBindingResponse"];

export type AttachArchitectureInventoryBindingRequest =
  components["schemas"]["AttachArchitectureInventoryBindingRequest"];

export async function getArchitectureInventoryBinding(
  architectureId: string,
): Promise<ArchitectureInventoryBindingResponse> {
  return apiGetSealedManifestAware<ArchitectureInventoryBindingResponse>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/inventory-binding`,
  );
}

export async function attachArchitectureInventoryBinding(
  architectureId: string,
  body: AttachArchitectureInventoryBindingRequest,
): Promise<ArchitectureInventoryBindingResponse> {
  try {
    return await apiPostJson<ArchitectureInventoryBindingResponse>(
      `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/inventory-binding`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureInventoryBindingBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function detachArchitectureInventoryBinding(architectureId: string): Promise<void> {
  try {
    await apiDelete(
      `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/inventory-binding`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureInventoryBindingBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
