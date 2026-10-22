import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** E2E fixture string — replaced in buyer-polished shell only (operator/e2e still match raw text). */
const FIXTURE_ALPHA_COST_LINE =
  "Fixture highlight alpha — cost increased from 100 to 120 with higher isolation in the target run.";

const BUYER_POLISHED_COST_LINE =
  "Estimated monthly platform operating cost increased with stronger isolation in the updated review.";

/**
 * Maps seeded compare summary strings to buyer-facing wording so packaged demos do not expose
 * internal fixture labels in the primary narrative.
 */
export function applyBuyerPolishedGoldenManifestSummaryHighlights(highlights: readonly string[]): string[] {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return [...highlights];
  }

  return highlights.map((line) => (line === FIXTURE_ALPHA_COST_LINE ? BUYER_POLISHED_COST_LINE : line));
}
