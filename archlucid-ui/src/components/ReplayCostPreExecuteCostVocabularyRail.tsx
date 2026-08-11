"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildReplayCostPreExecuteCostVocabulary,
  resolveReplayCostPreExecuteCostPeerLink,
  type ReplayCostPreExecuteCostSurfaceId,
  type ReplayCostPreExecuteCostVocabularyModel,
} from "@/lib/replay-cost-pre-execute-cost-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ReplayCostPreExecuteCostVocabularyRailProps = {
  /** Surface hosting the strip — marks the current cost job and links to the peer. */
  readonly currentSurfaceId: ReplayCostPreExecuteCostSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildReplayCostPreExecuteCostVocabulary}. */
  readonly model?: ReplayCostPreExecuteCostVocabularyModel;
};

/**
 * TB-2284 — Compact vocabulary rail between comparison replay cost and pre-execute cost.
 * Mount on both surfaces so operators do not conflate the two estimate jobs.
 * Distinct from TB-2233 pre-execute teaching itself.
 */
export function ReplayCostPreExecuteCostVocabularyRail(
  props: ReplayCostPreExecuteCostVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildReplayCostPreExecuteCostVocabulary();
  const peer = resolveReplayCostPreExecuteCostPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "replay-cost" ? model.replayCostLink : model.preExecuteCostLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="replay-cost-pre-execute-cost-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="replay-cost-pre-execute-cost-vocabulary-peer-link"
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
      aria-labelledby="replay-cost-pre-execute-cost-vocabulary-heading"
      data-testid="replay-cost-pre-execute-cost-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="replay-cost-pre-execute-cost-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="replay-cost-pre-execute-cost-vocabulary-honesty"
      >
        {model.estimatesHonesty}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="replay-cost-pre-execute-cost-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="replay-cost-pre-execute-cost-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
