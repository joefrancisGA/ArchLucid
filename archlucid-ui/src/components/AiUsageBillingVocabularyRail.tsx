"use client";

import type { JSX } from "react";

import {
  buildAiUsageBillingVocabulary,
  resolveAiUsageBillingPeerLink,
  type AiUsageBillingSurfaceId,
  type AiUsageBillingVocabularyModel,
} from "@/lib/vocabulary/ai-usage-billing-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type AiUsageBillingVocabularyRailProps = {
  /** Surface hosting the strip — marks the current admin job and links to the peer. */
  readonly currentSurfaceId: AiUsageBillingSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildAiUsageBillingVocabulary}. */
  readonly model?: AiUsageBillingVocabularyModel;
};

/**
 * TB-2253 — Compact vocabulary rail between AI usage estimates and Billing & plans.
 * Mount on both hubs so operators do not conflate cost telemetry with invoices.
 */
export function AiUsageBillingVocabularyRail(
  props: AiUsageBillingVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildAiUsageBillingVocabulary();
  const peer = resolveAiUsageBillingPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "ai-usage" ? model.aiUsageLink : model.billingLink;

  return (
    <VocabularyRail
      testIdPrefix="ai-usage-billing-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
      notes={[{ testIdSuffix: "honesty", text: model.estimatesHonesty }]}
    />
  );
}
