import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { apiGetSealedManifestAwareBlockedReason } from "@/lib/api/api-get-sealed-manifest-aware-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGet, type ApiGetOptions } from "./http";

/** GET JSON with lifecycle/sealed-hash 409 copy surfaced on failure (wave-45 suggestion 527). */
export async function apiGetSealedManifestAware<T>(
  path: string,
  options?: ApiGetOptions,
): Promise<T> {
  try {
    return await apiGet<T>(path, options);
  } catch (error: unknown) {
    const blockedReason = apiGetSealedManifestAwareBlockedReason(toApiLoadFailure(error));

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(error));
  }
}
