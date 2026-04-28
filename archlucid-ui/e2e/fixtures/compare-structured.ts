import type { GoldenManifestComparison } from "@/types/comparison";

import { FIXTURE_LEFT_RUN_ID, FIXTURE_RIGHT_RUN_ID } from "./ids";

/** Structured golden-manifest compare that passes `coerceGoldenManifestComparison`. */
export function fixtureGoldenManifestComparison(): GoldenManifestComparison {
  return {
    baseRunId: FIXTURE_LEFT_RUN_ID,
    targetRunId: FIXTURE_RIGHT_RUN_ID,
    decisionChanges: [
      {
        decisionKey: "claims.intake.boundary",
        baseValue: "v1",
        targetValue: "v2",
        changeType: "Modified",
      },
    ],
    requirementChanges: [],
    securityChanges: [],
    topologyChanges: [],
    costChanges: [{ baseCost: 100, targetCost: 120 }],
    summaryHighlights: [
      "Cost increased from 100 to 120 with higher isolation in the target run.",
      "One decision updated between base and target manifests.",
    ],
    totalDeltaCount: 2,
  };
}
