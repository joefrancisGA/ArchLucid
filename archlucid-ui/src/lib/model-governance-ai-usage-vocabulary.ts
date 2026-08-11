/**
 * TB-2286 — Model governance ≠ AI usage vocabulary rail.
 *
 * Why two administration surfaces exist:
 * - AI and model governance (`/administration/model-governance`) sets workspace
 *   execution profiles and governed model aliases used on reviews.
 * - AI usage (`/administration/ai-usage`) shows *estimated* AI spend, budgets,
 *   and workflow cost drivers for this workspace.
 *
 * They stay separate because choosing execution profiles is not reading usage
 * estimates. Distinct from AI usage ≠ Billing (TB-2253). Operators need both
 * with deep links so they do not treat policy as cost telemetry (or the reverse).
 */

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";

export type ModelGovernanceAiUsageSurfaceId = "model-governance" | "ai-usage";

export type ModelGovernanceAiUsageLink = {
  readonly id: ModelGovernanceAiUsageSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ModelGovernanceAiUsageVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly modelGovernanceLink: ModelGovernanceAiUsageLink;
  readonly aiUsageLink: ModelGovernanceAiUsageLink;
};

export const MODEL_GOVERNANCE_AI_USAGE_HEADING =
  "Model governance and AI usage stay separate" as const;

export const MODEL_GOVERNANCE_AI_USAGE_WHY_TWO =
  "AI and model governance sets workspace execution profiles and governed model aliases used on reviews. AI usage shows estimated spend, budgets, and workflow cost drivers. Choosing which profile runs is not reading usage estimates — open the peer link when you need the other job." as const;

export const MODEL_GOVERNANCE_AI_USAGE_COMPACT_LINE =
  "Model governance sets execution profiles; AI usage shows cost estimates — open the other when you need both." as const;

export const MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK: ModelGovernanceAiUsageLink = {
  id: "model-governance",
  label: "AI and model governance",
  href: MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
  whenToUse: "Manage workspace default execution profile and governed model aliases.",
};

export const MODEL_GOVERNANCE_AI_USAGE_USAGE_LINK: ModelGovernanceAiUsageLink = {
  id: "ai-usage",
  label: "AI usage and cost",
  href: AI_USAGE_SETTINGS_PATH,
  whenToUse: "Monitor estimated AI spend and budget utilization for this workspace.",
};

/** Full vocabulary model (heading, why-two, and deep links). */
export function buildModelGovernanceAiUsageVocabulary(): ModelGovernanceAiUsageVocabularyModel {
  return {
    heading: MODEL_GOVERNANCE_AI_USAGE_HEADING,
    whyTwo: MODEL_GOVERNANCE_AI_USAGE_WHY_TWO,
    compactLine: MODEL_GOVERNANCE_AI_USAGE_COMPACT_LINE,
    modelGovernanceLink: MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK,
    aiUsageLink: MODEL_GOVERNANCE_AI_USAGE_USAGE_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveModelGovernanceAiUsagePeerLink(
  currentSurfaceId: ModelGovernanceAiUsageSurfaceId,
): ModelGovernanceAiUsageLink {
  if (currentSurfaceId === "model-governance") {
    return MODEL_GOVERNANCE_AI_USAGE_USAGE_LINK;
  }

  return MODEL_GOVERNANCE_AI_USAGE_GOVERNANCE_LINK;
}
