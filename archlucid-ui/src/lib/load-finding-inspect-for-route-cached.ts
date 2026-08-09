import { cache } from "react";

import {
  loadFindingInspectForRoute,
  type LoadFindingInspectForRouteResult,
} from "@/lib/load-finding-inspect-for-route";

/**
 * Per-request memo so `generateMetadata` and the page loader share one inspect fetch
 * instead of issuing two back-to-back `GET .../inspect` calls for the same finding.
 *
 * Keep this module server-only (do not import from Client Components).
 */
export const loadFindingInspectForRouteCached = cache(
  async (
    runId: string,
    decodedFindingId: string,
    includeTypedPayload: boolean,
  ): Promise<LoadFindingInspectForRouteResult> => {
    return loadFindingInspectForRoute(runId, decodedFindingId, { includeTypedPayload });
  },
);
