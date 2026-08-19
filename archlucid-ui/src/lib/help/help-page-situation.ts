/**
 * Review situations a page can publish to the Help drawer.
 *
 * Path-prefix recommendations only know which route is open. A situation says what is
 * actually wrong with the review on screen, so "Do this now" can name the blocking
 * condition instead of repeating generic page guidance.
 */
export type HelpPageSituation = "review-approval-blocked" | "review-evidence-incomplete";

/** Curated topic ids answered by each situation, highest priority first. */
export const HELP_PAGE_SITUATION_TOPIC_IDS: Readonly<Record<HelpPageSituation, readonly string[]>> = {
  "review-approval-blocked": ["resolve-blocking-findings", "governance-workflow", "review-artifacts"],
  "review-evidence-incomplete": ["close-evidence-gaps", "review-findings", "finalize-review"],
};

/** Topic ids for a published situation; empty when the page published nothing. */
export function helpPageSituationTopicIds(situation: HelpPageSituation | null): readonly string[] {
  if (situation === null) {
    return [];
  }

  return HELP_PAGE_SITUATION_TOPIC_IDS[situation];
}
