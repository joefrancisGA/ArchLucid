import { getPilotScorecard } from "@/lib/api";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

export type PilotScorecardPageServerLoad = {
  readonly data: PilotScorecardJson | null;
  readonly error: string | null;
};

export async function loadPilotScorecardPageData(): Promise<PilotScorecardPageServerLoad> {
  try {
    const data = await getPilotScorecard();

    return { data, error: null };
  } catch (e: unknown) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to load scorecard.",
    };
  }
}
