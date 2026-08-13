import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

import { tryStaticDemoGoldenManifestComparison } from "./run-list-and-compare";
import { tryStaticDemoRunDetail, tryStaticDemoManifestSummary } from "./showcase-spine-payloads";
import { tryStaticDemoProvenanceGraph } from "./provenance-graph";
import { tryStaticDemoGovernanceApprovalRequests } from "./governance-and-alerts";
import { isStaticDemoPayloadFallbackEnabled } from "./eligibility";

/** True when curated static payloads exist for all five CTO demo spine steps. */
export function areSpineStaticDemoPayloadsAvailable(): boolean {
  const runId = SHOWCASE_STATIC_DEMO_RUN_ID;

  if (!isStaticDemoPayloadFallbackEnabled()) {
    return false;
  }

  if (tryStaticDemoRunDetail(runId) === null) {
    return false;
  }

  if (tryStaticDemoManifestSummary(SHOWCASE_STATIC_DEMO_MANIFEST_ID) === null) {
    return false;
  }

  if (tryStaticDemoProvenanceGraph(runId) === null) {
    return false;
  }

  if (tryStaticDemoGovernanceApprovalRequests(runId) === null) {
    return false;
  }

  if (
    tryStaticDemoGoldenManifestComparison(
      SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
      SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
    ) === null
  ) {
    return false;
  }

  return true;
}
