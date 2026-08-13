import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";

/** Step 1 of the buyer golden journey — executive summary for the static showcase. */
export function getStartCtoDemoHref(): string {
  return BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[0].href;
}
