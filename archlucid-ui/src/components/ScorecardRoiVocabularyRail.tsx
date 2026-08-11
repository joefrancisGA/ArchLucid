"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildScorecardRoiVocabulary,
  resolveScorecardRoiPeerLink,
  type ScorecardRoiSurfaceId,
  type ScorecardRoiVocabularyModel,
} from "@/lib/vocabulary/scorecard-roi-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ScorecardRoiVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ScorecardRoiSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildScorecardRoiVocabulary}. */
  readonly model?: ScorecardRoiVocabularyModel;
};

/**
 * TB-2265 — Compact vocabulary rail between architecture scorecard and ROI summary.
 * Distinct from TB-2258 (ROI summary ≠ sponsor export). Mount on both Insights surfaces.
 */
export function ScorecardRoiVocabularyRail(
  props: ScorecardRoiVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildScorecardRoiVocabulary();
  const peer = resolveScorecardRoiPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "scorecard" ? model.scorecardLink : model.roiSummaryLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="scorecard-roi-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="scorecard-roi-vocabulary-peer-link"
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
      aria-labelledby="scorecard-roi-vocabulary-heading"
      data-testid="scorecard-roi-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="scorecard-roi-vocabulary-heading"
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
          data-testid="scorecard-roi-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="scorecard-roi-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
