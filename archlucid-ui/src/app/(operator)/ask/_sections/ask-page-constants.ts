/**
 * Operator shell: suggested starters use {@link ASK_EXAMPLE_PROMPTS}; buyer shell groups {@link ASK_BUYER_PROMPT_GROUPS}.
 */
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

export const ASK_EXAMPLE_PROMPTS: readonly string[] = [
  "Summarize the PHI risk for this review.",
  "What should the sponsor review before sign-off?",
  "Summarize this for an executive sponsor.",
  "Which finding should we fix first, and why?",
];

export type AskBuyerPromptGroup = {
  readonly heading: string;
  readonly prompts: readonly string[];
};

/** Buyer shell: suggested prompts grouped by intent (question form starters + post-reply follow-ups). */
export const ASK_BUYER_PROMPT_GROUPS: readonly AskBuyerPromptGroup[] = [
  {
    heading: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
    prompts: [
      "Summarize this for an executive sponsor.",
      "What are the top three risks I should brief leadership on?",
      "What should I tell my CTO in the first 90 seconds?",
    ],
  },
  {
    heading: "Mitigation",
    prompts: [
      "What blocks approval right now?",
      "Which finding should we fix first, and why?",
      "Which risks remain accepted with monitoring?",
    ],
  },
  {
    heading: "Evidence",
    prompts: [
      "What evidence supports the top finding in this review?",
      "Which recommendations are estimates rather than evidence-backed conclusions?",
    ],
  },
];

/** Shown when Ask opens with <code>?runId=…</code> deep link (review-scoped starters). */
export const ASK_DEEP_LINK_RUN_PROMPTS: readonly string[] = [
  "What changed in this review that leadership must know?",
  "List open issues blocking sign-off for this package.",
  "What evidence supports the top finding in this review?",
  "What should I tell my CTO in the first 90 seconds?",
  "Which finding should we fix first, and why?",
];

/** Flat list of buyer starter prompts — used to hide duplicates when post-reply follow-ups are shown. */
export function buyerAskStarterPromptLines(): readonly string[] {
  return ASK_BUYER_PROMPT_GROUPS.flatMap((group) => group.prompts);
}
