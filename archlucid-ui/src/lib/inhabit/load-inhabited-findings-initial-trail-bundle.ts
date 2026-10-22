import "server-only";

import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import {
  resolveInhabitedFindingsTrailBundleSnapshot,
  type InhabitedFindingsTrailBundleSnapshot,
} from "@/lib/inhabit/inhabited-findings-trail-bundle";
import { resolveServerScopeHeadersForRun } from "@/lib/server-run-scope";

/** IP-011 — server prefetch of the existing critical-page bundle for inhabited first paint. */
export async function loadInhabitedFindingsInitialTrailBundle(
  runId: string,
): Promise<InhabitedFindingsTrailBundleSnapshot | null> {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  try {
    const serverScopeHeaders = await resolveServerScopeHeadersForRun(trimmedRunId);
    const bundleResponse = await fetchRunDetailCriticalPageBundle(trimmedRunId, {
      scopeHeaders: serverScopeHeaders,
    });

    return resolveInhabitedFindingsTrailBundleSnapshot(trimmedRunId, bundleResponse.data);
  } catch {
    return null;
  }
}
