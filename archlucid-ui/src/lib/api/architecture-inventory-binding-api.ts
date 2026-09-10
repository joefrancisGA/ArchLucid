import type { components } from "@/lib/api-types/schemas.generated";

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
  return apiPostJson<ArchitectureInventoryBindingResponse>(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/inventory-binding`,
    body,
  );
}

export async function detachArchitectureInventoryBinding(architectureId: string): Promise<void> {
  await apiDelete(
    `${ARCHITECTURES_BASE}/${encodeURIComponent(architectureId.trim())}/inventory-binding`,
  );
}
