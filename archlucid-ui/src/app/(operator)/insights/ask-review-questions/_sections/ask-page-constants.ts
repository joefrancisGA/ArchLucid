/**
 * Operator shell: suggested starters use {@link ASK_EXAMPLE_PROMPTS}; buyer shell groups {@link ASK_BUYER_PROMPT_GROUPS}.
 */
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

export const ASK_EXAMPLE_PROMPTS: readonly string[] = [
  "Summarize the findings on this review.",
  "What should the sponsor review before sign-off?",
  "Summarize this for a sponsor.",
  "Which finding should we fix first, and why?",
];

export type AskBuyerPromptGroup = {
  readonly heading: string;
  readonly prompts: readonly string[];
};

/** Buyer shell: suggested prompts grouped by intent (question form starters + post-reply follow-ups). */
export const ASK_BUYER_PROMPT_GROUPS: readonly AskBuyerPromptGroup[] = [
  {
    heading: BUYER_SPONSOR_SUMMARY_VOCABULARY.reviewSponsorReportLabel,
    prompts: [
      "Summarize this for a sponsor.",
      "Which findings should I brief?",
      "What should I tell my CTO in the first 90 seconds?",
    ],
  },
  {
    heading: "Mitigation",
    prompts: [
      "What blocks approval right now?",
      "Which finding should we fix first, and why?",
      "Which findings have a stored accepted-with-monitoring disposition?",
    ],
  },
  {
    heading: "Evidence",
    prompts: [
      "What evidence is cited on the highest stored-severity finding?",
      "Which recommendations are estimates rather than evidence-backed conclusions?",
    ],
  },
];

/** Shown when Ask opens with <code>?runId=…</code> deep link (review-scoped starters). */
export const ASK_DEEP_LINK_RUN_PROMPTS: readonly string[] = [
  "What changed in this review that leadership must know?",
  "List open issues blocking sign-off for this review.",
  "What evidence is cited on the highest stored-severity finding?",
  "What should I tell my CTO in the first 90 seconds?",
  "Which finding should we fix first, and why?",
];

/** Flat list of buyer starter prompts — used to hide duplicates when post-reply follow-ups are shown. */
export function buyerAskStarterPromptLines(): readonly string[] {
  return ASK_BUYER_PROMPT_GROUPS.flatMap((group) => group.prompts);
}

/** Clickable starters on an empty Ask thread when a review is selected. */
export const ASK_EMPTY_THREAD_REVIEW_STARTER_PROMPTS: readonly string[] = [
  "What findings are on this review?",
  "What is still open before finalize?",
  "Summarize for a sponsor.",
];
