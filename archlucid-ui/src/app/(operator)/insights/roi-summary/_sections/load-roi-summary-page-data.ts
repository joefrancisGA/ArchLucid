import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

import { fetchRoiSummaryPageState } from "./fetch-roi-summary-page-state";
import type { RoiSummaryPageState } from "./roi-summary-page-types";

export type RoiSummaryDemoLoad = {
  readonly mode: "demo";
};

export type RoiSummaryLiveLoad = {
  readonly mode: "live";
  readonly initialState: Exclude<RoiSummaryPageState, { status: "loading" }>;
};

export type RoiSummaryPageServerLoad = RoiSummaryDemoLoad | RoiSummaryLiveLoad;

export async function loadRoiSummaryPageData(): Promise<RoiSummaryPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  if (demo) {
    return { mode: "demo" };
  }

  const initialState = await fetchRoiSummaryPageState();

  return { mode: "live", initialState };
}
