import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

/** Friendly labels for known demo/compare URL segments — avoids raw IDs in primary Compare UI. */
export function compareRunHeadingLabel(runId: string): string {
  const buyer = compareRunBuyerDisplayLabel(runId);

  if (buyer !== null) {
    return buyer;
  }

  const u = runId.trim();

  if (u === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return "Claims Intake (completed review)";
  }

  return u;
}
