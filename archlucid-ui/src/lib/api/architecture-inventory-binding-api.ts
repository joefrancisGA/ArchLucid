import type { components } from "@/lib/api-types/schemas.generated";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { architectureInventoryBindingBlockedReason } from "@/lib/architecture/architecture-inventory-binding-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { encodeRequiredPathSegment, trimRequiredText } from "./api-boundary-normalization";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiDelete, apiPostJson } from "./http";

const ARCHITECTURES_BASE = "/v1/architectures";

export type ArchitectureInventoryBindingResponse =
  components["schemas"]["ArchitectureInventoryBindingResponse"];

export type AttachArchitectureInventoryBindingRequest =
  components["schemas"]["AttachArchitectureInventoryBindingRequest"];

/** Builds the binding path. A blank architecture id throws before any request is sent. */
function inventoryBindingPath(architectureId: string): string {
  return `${ARCHITECTURES_BASE}/${encodeRequiredPathSegment(architectureId, "architectureId")}/inventory-binding`;
}

export async function getArchitectureInventoryBinding(
  architectureId: string,
): Promise<ArchitectureInventoryBindingResponse> {
  const path = inventoryBindingPath(architectureId);

  return apiGetSealedManifestAware<ArchitectureInventoryBindingResponse>(path);
}

export async function attachArchitectureInventoryBinding(
  architectureId: string,
  body: AttachArchitectureInventoryBindingRequest,
): Promise<ArchitectureInventoryBindingResponse> {
  const path = inventoryBindingPath(architectureId);
  const normalizedBody: AttachArchitectureInventoryBindingRequest = {
    snapshotId: trimRequiredText(body.snapshotId, "snapshotId"),
  };

  try {
    return await apiPostJson<ArchitectureInventoryBindingResponse>(path, normalizedBody);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureInventoryBindingBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function detachArchitectureInventoryBinding(architectureId: string): Promise<void> {
  const path = inventoryBindingPath(architectureId);

  try {
    await apiDelete(path);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureInventoryBindingBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
