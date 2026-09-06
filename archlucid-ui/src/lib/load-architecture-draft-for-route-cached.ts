import { cache } from "react";

import { getDraftRequest } from "@/lib/api/draft-intake-api";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";
import type { DraftRequestResponse } from "@/types/draft-intake";

/**
 * Per-request memo so `generateMetadata` and route loaders share one draft fetch.
 * Keep this module server-only (do not import from Client Components).
 */
export const loadArchitectureDraftForRouteCached = cache(
  async (draftId: string): Promise<DraftRequestResponse> => {
    const startedMs = performance.now();
    console.warn(
      JSON.stringify({
        component: "archlucid-ui-draft-metadata",
        event: "metadata_draft_fetch_started",
        draftId,
      }),
    );

    try {
      const scopeHeaders = await getServerResolvedScopeHeaders();
      const draft = await getDraftRequest(draftId, { scopeHeaders });
      console.warn(
        JSON.stringify({
          component: "archlucid-ui-draft-metadata",
          event: "metadata_draft_fetch_completed",
          draftId,
          durationMs: Math.round(performance.now() - startedMs),
        }),
      );

      return draft;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        JSON.stringify({
          component: "archlucid-ui-draft-metadata",
          event: "metadata_draft_fetch_failed",
          draftId,
          durationMs: Math.round(performance.now() - startedMs),
          message,
        }),
      );
      throw err;
    }
  },
);
