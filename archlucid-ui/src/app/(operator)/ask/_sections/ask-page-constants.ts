/**
 * Operator shell: at most three suggested prompts (buyer shell uses `ASK_FOLLOW_UP_CHIPS_BUYER`).
 */
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

export const ASK_EXAMPLE_PROMPTS: readonly string[] = [
  "Summarize the PHI risk for this review.",
  "What should the sponsor review before sign-off?",
  "Summarize this for an executive sponsor.",
];

export const ASK_FOLLOW_UP_CHIPS_BUYER: readonly string[] = [
  "What evidence supports the PHI minimization decision?",
  "Which risks remain accepted with monitoring?",
  "What are the top three risks I should brief leadership on?",
  "What should we validate before go-live?",
  "Summarize the mitigation pattern in one paragraph.",
];

export type AskBuyerPromptGroup = {
  readonly heading: string;
  readonly prompts: readonly string[];
};

/** Buyer shell: suggested prompts grouped by intent (flat list remains for operator shell). */
export const ASK_BUYER_PROMPT_GROUPS: readonly AskBuyerPromptGroup[] = [
  {
    heading: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
    prompts: [
      "Summarize this for an executive sponsor.",
      "What are the top three risks I should brief leadership on?",
    ],
  },
  {
    heading: "Go-live readiness",
    prompts: [
      "What should the sponsor review before sign-off?",
      "What should we validate before go-live?",
    ],
  },
  {
    heading: "Mitigation",
    prompts: [
      "Summarize the PHI risk for this review.",
      "Summarize the mitigation pattern in one paragraph.",
    ],
  },
];

/** Shown when Ask opens with <code>?runId=…</code> deep link (review-scoped starters). */
export const ASK_DEEP_LINK_RUN_PROMPTS: readonly string[] = [
  "What changed in this review that leadership must know?",
  "List open issues blocking sign-off for this package.",
  "What evidence supports the top finding in this review?",
];
