import { cache } from "react";

import { getDraftRequest } from "@/lib/api/draft-intake-api";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";
import type { DraftRequestResponse } from "@/types/draft-intake";

/**
 * Per-request memo so `generateMetadata` and future server loaders share one draft fetch.
 * Keep this module server-only (do not import from Client Components).
 */
export const loadArchitectureDraftForRouteCached = cache(
  async (architectureId: string): Promise<DraftRequestResponse> => {
    const scopeHeaders = await getServerResolvedScopeHeaders();

    return getDraftRequest(architectureId, { scopeHeaders });
  },
);
