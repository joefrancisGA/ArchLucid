import "server-only";

import { getPilotScorecard } from "@/lib/api";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

export type PilotScorecardPageServerLoad = {
  readonly data: PilotScorecardJson | null;
  readonly error: string | null;
};

/**
 * SSR load for Architecture scorecard. Uses cookie-mirrored operator scope (same as Reviews hub),
 * not bare `getScopeHeaders()` defaults — otherwise a finalized review in the active workspace can
 * be invisible when the API key / claims tenant differs from the switcher.
 */
export async function loadPilotScorecardPageData(): Promise<PilotScorecardPageServerLoad> {
  try {
    const scopeHeaders = await getServerResolvedScopeHeaders();
    const data = await getPilotScorecard({ scopeHeaders });

    return { data, error: null };
  } catch (e: unknown) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to load scorecard.",
    };
  }
}
