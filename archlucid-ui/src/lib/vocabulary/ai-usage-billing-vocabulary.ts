/**
 * TB-2253 — AI usage ≠ Billing vocabulary rail.
 *
 * Why two administration surfaces exist:
 * - AI usage (`/administration/ai-usage`) shows *estimated* AI spend, budgets,
 *   and workflow cost drivers for this workspace.
 * - Billing & plans (`/administration/billing`) manages commercial plan,
 *   invoices, and payment — not model-usage estimates.
 *
 * They stay separate because usage estimates are not invoices. Operators need
 * both surfaces with deep links so they do not treat cost telemetry as billing
 * (or the reverse). Honesty: estimates ≠ invoices.
 */

import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";

export type AiUsageBillingSurfaceId = "ai-usage" | "billing";

export type AiUsageBillingLink = {
  readonly id: AiUsageBillingSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AiUsageBillingVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  /** Usage figures are estimates — not invoices or billed amounts. */
  readonly estimatesHonesty: string;
  readonly aiUsageLink: AiUsageBillingLink;
  readonly billingLink: AiUsageBillingLink;
};

export const AI_USAGE_BILLING_HEADING = "AI usage and Billing stay separate" as const;

export const AI_USAGE_BILLING_WHY_TWO =
  "AI usage shows estimated spend, budgets, and workflow cost drivers for this workspace. Billing & plans manages commercial plan, invoices, and payment. Usage estimates are not invoices." as const;

export const AI_USAGE_BILLING_COMPACT_LINE =
  "AI usage shows cost estimates; Billing manages plans and invoices — open the other when you need both." as const;

export const AI_USAGE_BILLING_ESTIMATES_HONESTY =
  "AI usage figures are estimates for operator budgeting — they are not invoices or billed amounts." as const;

export const AI_USAGE_BILLING_AI_USAGE_LINK: AiUsageBillingLink = {
  id: "ai-usage",
  label: "AI usage and cost",
  href: AI_USAGE_SETTINGS_PATH,
  whenToUse: "Monitor estimated AI spend and budget utilization for this workspace.",
};

export const AI_USAGE_BILLING_BILLING_LINK: AiUsageBillingLink = {
  id: "billing",
  label: "Billing & plans",
  href: SETTINGS_BILLING_PATH,
  whenToUse: "Manage commercial plan, invoices, and payment.",
};

/** Full vocabulary model (heading, why-two, honesty, and deep links). */
export function buildAiUsageBillingVocabulary(): AiUsageBillingVocabularyModel {
  return {
    heading: AI_USAGE_BILLING_HEADING,
    whyTwo: AI_USAGE_BILLING_WHY_TWO,
    compactLine: AI_USAGE_BILLING_COMPACT_LINE,
    estimatesHonesty: AI_USAGE_BILLING_ESTIMATES_HONESTY,
    aiUsageLink: AI_USAGE_BILLING_AI_USAGE_LINK,
    billingLink: AI_USAGE_BILLING_BILLING_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAiUsageBillingPeerLink(
  currentSurfaceId: AiUsageBillingSurfaceId,
): AiUsageBillingLink {
  if (currentSurfaceId === "ai-usage") {
    return AI_USAGE_BILLING_BILLING_LINK;
  }

  return AI_USAGE_BILLING_AI_USAGE_LINK;
}
