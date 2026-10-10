import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { apiGetSealedManifestAwareBlockedReason } from "@/lib/api/api-get-sealed-manifest-aware-blocked-reason";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGet, type ApiGetOptions } from "./http";

/** GET JSON with lifecycle/sealed-hash 409 copy surfaced on failure (wave-45 suggestion 527). */
export async function apiGetSealedManifestAware<T>(
  path: string,
  options?: ApiGetOptions,
): Promise<T> {
  try {
    return await apiGet<T>(path, options);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);

    if (isApiNotFoundFailure(failure)) {
      // Preserve the structured 404 so route loaders can render branded missing-resource recovery.
      throw error;
    }

    const blockedReason = apiGetSealedManifestAwareBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(error));
  }
}
