import { cache } from "react";

import { fetchRunDetailWorkspaceContextBundle } from "@/lib/fetch-run-detail-page-bundle-client";

/** Per-request memo for workspace context used by mid and below-fold deferred run-detail loaders. */
export const loadRunDetailWorkspaceContextBundleCached = cache(async (runId: string) => {
  return await fetchRunDetailWorkspaceContextBundle(runId);
});
