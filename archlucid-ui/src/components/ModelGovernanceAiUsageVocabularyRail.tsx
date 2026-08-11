"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildModelGovernanceAiUsageVocabulary,
  resolveModelGovernanceAiUsagePeerLink,
  type ModelGovernanceAiUsageSurfaceId,
  type ModelGovernanceAiUsageVocabularyModel,
} from "@/lib/vocabulary/model-governance-ai-usage-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ModelGovernanceAiUsageVocabularyRailProps = {
  /** Surface hosting the strip — marks the current admin job and links to the peer. */
  readonly currentSurfaceId: ModelGovernanceAiUsageSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildModelGovernanceAiUsageVocabulary}. */
  readonly model?: ModelGovernanceAiUsageVocabularyModel;
};

/**
 * TB-2286 — Compact vocabulary rail between model governance and AI usage.
 * Mount on both hubs so operators do not conflate execution profiles with cost estimates.
 * Distinct from AI usage ≠ Billing (TB-2253).
 */
export function ModelGovernanceAiUsageVocabularyRail(
  props: ModelGovernanceAiUsageVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildModelGovernanceAiUsageVocabulary();
  const peer = resolveModelGovernanceAiUsagePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "model-governance"
      ? model.modelGovernanceLink
      : model.aiUsageLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="model-governance-ai-usage-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="model-governance-ai-usage-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="model-governance-ai-usage-vocabulary-heading"
      data-testid="model-governance-ai-usage-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="model-governance-ai-usage-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="model-governance-ai-usage-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="model-governance-ai-usage-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
